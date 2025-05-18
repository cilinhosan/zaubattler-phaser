import Phaser from 'phaser';
import battlesData from './game/battles.json'; // Import battle data
import BattleCharacter from './game/BattleCharacter.js'; // Use BattleCharacter for enemies in this scene
import { getCharacterDefinition } from './CharacterDefinitionList.js'; // Corrected import path
import MenuCharacterDisplay from './game/MenuCharacterDisplay.js'; // Import MenuCharacterDisplay
import GameDataManager from './game/GameDataManager.js'; // Import the GameDataManager singleton
import setupLoadingIndicator from './LoadingIndicator.js'; // Import the utility function (Corrected path)
import AssetLoader from './AssetLoader.js'; // Import the AssetLoader class
import BattleRewardScene from './BattleRewardScene.js'; // Import the reward scene
import menuBackground3 from '../assets/menu_background_illustration_3.jpg';
import { CharacterProfileScene } from './CharacterProfileScene'; // Added import

class PreBattleSetupScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreBattleSetupScene' });
        this.enemyDisplayGroup = null; // To hold enemy display objects
        this.currentEnemyTeam = []; // To hold the loaded enemy BattleCharacter instances
        this.battleTitleText = null; // To hold the centered battle title text
    }

    preload() {
        console.log('PreBattleSetupScene: preload()');
        this.load.image('menuBg3', menuBackground3);

        // --- Load Manifest ---
        const manifest = this.registry.get('assetManifest');

        if (!manifest) {
            console.error('PreBattleSetupScene: Asset Manifest not found in registry!');
            // Display error message directly if manifest is missing
            this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2,
                'Error: Asset Manifest missing!\nCannot load assets.',
                { fill: '#ff0000', fontSize: '24px', align: 'center' }
            ).setOrigin(0.5);
            return; // Stop preloading if manifest is missing
        }
        console.log('PreBattleSetupScene: Found Asset Manifest:', manifest);

        // --- Setup Loading Indicator ---
        // Call the utility function, passing the scene context and a title
        setupLoadingIndicator(this); // Use default 'Loading...' title

        // --- Instantiate AssetLoader ---
        const assetLoader = new AssetLoader(this);
        if (!assetLoader.manifest) {
            console.error("PreBattleSetupScene: AssetLoader could not initialize (manifest missing). Stopping preload.");
            // Optionally display an error message on screen
            return;
        }

        // --- Load Default Icons using AssetLoader ---
        // Note: Using preloadAsset for defaults as they don't have a full 'definition' object
        assetLoader.preloadAsset('default_character_icon', 'assets/default_character_ilustration_face_icon.png');
        assetLoader.preloadAsset('default_battle_icon', 'assets/default_character_ilustration_4_3.png');
        assetLoader.preloadAsset('enemy_icon', 'assets/default_enemy_illustration_face_icon.png'); // Keep original key for now if used elsewhere
        assetLoader.preloadAsset('default_enemy_icon', 'assets/default_enemy_illustration_4_3.png');


        // --- Preload Specific Character Icons (Face and Battle) using AssetLoader ---
        const currentCharacterInventory = GameDataManager.getCharacterInventory();
        const currentTeamSlots = GameDataManager.getTeamSlots();
        // Create a Set of unique definition IDs to avoid redundant loading calls
        const uniqueDefinitionIds = new Set();
        currentCharacterInventory.forEach(charData => charData?.definitionId && uniqueDefinitionIds.add(charData.definitionId));
        currentTeamSlots.forEach(charData => charData?.definitionId && uniqueDefinitionIds.add(charData.definitionId));

        uniqueDefinitionIds.forEach(definitionId => {
            const definition = getCharacterDefinition(definitionId);
            if (!definition) {
                console.warn(`PreBattleSetupScene: Could not find definition for ID '${definitionId}' while preloading assets.`);
                return; // Skip if definition not found
            }

            // --- Load Face Icon using Robust AssetLoader ---
            if (definition.faceIconPath && definition.faceIconKey) {
                // Pass the Phaser key and original path from the definition
                assetLoader.preloadAsset(definition.faceIconKey, definition.faceIconPath, 'image');
            } else {
                console.warn(`PreBattleSetupScene: Definition '${definitionId}' missing faceIconPath or faceIconKey.`);
            }

            // --- Load Battle Icon using Robust AssetLoader ---
            if (definition.battleIconPath && definition.battleIconKey) {
                // Pass the Phaser key and original path from the definition
                assetLoader.preloadAsset(definition.battleIconKey, definition.battleIconPath, 'image');
            } else {
                console.warn(`PreBattleSetupScene: Definition '${definitionId}' missing battleIconPath or battleIconKey.`);
            }
        });

        console.log('PreBattleSetupScene: preload() finished queuing assets via Robust AssetLoader.');
    }

    create() {
        console.log("PreBattleSetupScene: create() started."); // Added log

        // --- Check for Battle Win Result Immediately ---
        const lastBattleResult = GameDataManager.getLastBattleResult();
        console.log("[Create Debug] Checked lastBattleResult:", lastBattleResult);

        if (lastBattleResult !== GameDataManager.NO_BATTLE_RESULT && lastBattleResult.won === true) {
            console.log("[Create Debug] Win detected! Redirecting to BattleRewardScene.");
            const battleIndex = GameDataManager.getCurrentBattleIndex(); // Index of completed battle

            // Award tickets
            const ticketReward = this._getTicketReward(battleIndex);
            console.log(`[Create Debug] Awarding ${ticketReward} tickets.`);
            GameDataManager.addTickets(ticketReward);

            // DO NOT clear the result flag here. BattleRewardScene will handle it.
            // GameDataManager.setLastBattleResult(null); // OLD LINE - REMOVED
            // console.log("[Create Debug] Cleared lastBattleResult in GameDataManager."); // OLD LINE - REMOVED

            // Start the reward scene
            this.scene.start('BattleRewardScene', { battleIndex: battleIndex });
            return; // IMPORTANT: Stop executing the rest of create()
        }
        console.log("[Create Debug] No win detected or result already processed. Proceeding with normal setup.");

        // --- Original Create Logic Starts Here ---
        // Set background image
        let bg = this.add.image(0, 0, 'menuBg3').setOrigin(0, 0);
        let scaleX = this.cameras.main.width / bg.width;
        let scaleY = this.cameras.main.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);
        // this.add.image(400, 300, 'background'); // Add background if you have one

        // Get current team slots and inventory from the GameDataManager
        const playerTeamSlotsData = GameDataManager.getTeamSlots(); // Array with character data or nulls
        const playerCharacterInventory = GameDataManager.getCharacterInventory();
        const battleIndex = GameDataManager.getCurrentBattleIndex(); // Get index from manager

        // Initialize the group to hold enemy display objects
        this.enemyDisplayGroup = this.add.group();

        // --- Load and Display Initial Battle Data ---
        this._loadAndDisplayBattleData(battleIndex);

        // --- New Layout Setup (Player Side) ---

        // Player Team Slots (Mid-Top Left)
        this.playerTeamTitle = this.add.text(350, 150, 'Your Team', { fontSize: '48px', fill: '#fff' }); // Store reference if needed later
        this.playerTeamSlots = []; // Array to hold slot graphics/containers
        this.playerTeamDisplays = []; // Array to hold character display objects in slots
        const playerSlotPositions = [
            { x: 200, y: 250 }, // Slot 1
            { x: 350, y: 250 }, // Slot 2
            { x: 500, y: 250 }, // Slot 3
            { x: 650, y: 250 }, // Slot 4
            { x: 800, y: 250 }, // Slot 5
        ];
        playerSlotPositions.forEach((pos, index) => {
            const slot = this.add.rectangle(pos.x, pos.y, 100, 100, 0x444444).setStrokeStyle(2, 0xffffff);
            slot.setData('slotIndex', index);
            slot.setInteractive();
            // Add click handler for team slots
            // Capture pointer and event objects
            slot.on('pointerdown', (pointer, localX, localY, event) => {
                // Pass the event object to the handler
                this._handleTeamSlotClick(index, event); // Pass the slot index and event
            });
            this.playerTeamSlots.push(slot);
            this.playerTeamDisplays.push(null); // Initialize display array with null
        });
        // Player team slots created

        // --- Scrollable Player Inventory ---
        const inventoryTitleText = this.add.text(this.cameras.main.width / 2, 450, 'Member Reserve', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        const textBottomY = inventoryTitleText.y + inventoryTitleText.height * (1 - inventoryTitleText.originY); // Calculate bottom based on origin
        console.log(`[Debug Layout] Inventory Title Text Bottom Y: ${textBottomY.toFixed(1)}`); // <-- ADD LOG

        // --- Calculate Inventory Area Position ---
        const inventoryPaddingY = 20; // Space between title and inventory area
        const inventoryAreaY = textBottomY + inventoryPaddingY;
        console.log(`[Debug Layout] Calculated inventoryAreaY: ${inventoryAreaY}`); // <-- ADD LOG

        this.characterInventoryDisplays = []; // Array to hold MenuCharacterDisplay objects for inventory
        this.characterInventoryData = playerCharacterInventory; // Store the raw inventory data

        const inventoryAreaX = 50;
        // inventoryAreaY is now calculated above
        const inventoryAreaWidth = this.cameras.main.width - 100; // Back to local const
        const inventoryAreaHeight = 300; // Visible height

        // Create a container for all inventory items
        this.characterInventoryContainer = this.add.container(inventoryAreaX, inventoryAreaY);

        // Simple grid layout within the container
        const inventoryStartX = 50; // Relative to container
        const inventoryStartY = 20; // Relative to container
        const inventorySpacingX = 150; // Increased horizontal spacing
        const inventorySpacingY = 170; // Increased vertical spacing (box is 100, text adds ~25)
        const itemsPerRow = Math.floor((inventoryAreaWidth - inventoryStartX * 2) / inventorySpacingX); // Use local const
        let maxContentHeight = 0; // Back to local variable (use let as it's reassigned)

        this.characterInventoryData.forEach((charData, index) => {
            const gridX = index % itemsPerRow;
            const gridY = Math.floor(index / itemsPerRow);
            const displayX = inventoryStartX + gridX * inventorySpacingX;
            const displayY = inventoryStartY + gridY * inventorySpacingY;

            const charDisplay = new MenuCharacterDisplay(this, displayX, displayY, charData);
            // charDisplay.setInteractive(); // REMOVED - Let MenuCharacterDisplay handle its own interaction setup

            // Store the display object and link it to the data
            this.characterInventoryDisplays.push(charDisplay);
            charDisplay.setData('characterData', charData);
            charDisplay.setData('inventoryIndex', index);

            // REMOVED individual item listener

            // Add the display to the container
            this.characterInventoryContainer.add(charDisplay);

            maxContentHeight = Math.max(maxContentHeight, displayY + charDisplay.height); // Use local variable
        });

        // Set the container interactive over its full potential height
        // Use stored properties
        // Use local variables
        this.characterInventoryContainer.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, inventoryAreaWidth, maxContentHeight),
            Phaser.Geom.Rectangle.Contains
        );

        // Add pointerdown listener to the container
        this.characterInventoryContainer.on('pointerdown', (pointer, localX, localY, event) => {
            console.log(`[Debug] characterInventoryContainer pointerdown: localX=${localX.toFixed(1)}, localY=${localY.toFixed(1)}`);

            // REMOVED: Check for popupJustClosedByButton flag (This comment confirms removal from previous attempt)

            // Iterate through children to find which one was clicked
            let clickedChild = null;
            let clickedCharData = null;

            for (const child of this.characterInventoryContainer.list) {
                // Check if the click is within the child's 100x100 box area
                // child.x/y are relative to the container
                if (child instanceof MenuCharacterDisplay && // Ensure it's the correct type
                    localX >= child.x && localX <= child.x + child.rectWidth &&
                    localY >= child.y && localY <= child.y + child.rectHeight)
                {
                    clickedChild = child;
                    clickedCharData = child.getData('characterData');
                    console.log(`[Debug] Hit detected on child: ${clickedCharData.name} at child coords (${(localX - child.x).toFixed(1)}, ${(localY - child.y).toFixed(1)})`);
                    break; // Found the clicked item
                }
            }

            if (clickedChild && clickedCharData) {
                // Use pointer's world coordinates for popup positioning
                const popupTargetX = pointer.worldX;
                const popupTargetY = pointer.worldY;

                if (this.actionPopup && this.actionPopup.getData('targetDisplay') === clickedChild) {
                    console.log(`[Debug] Click ignored, popup already open for ${clickedCharData.name}`);
                    return;
                }
                // No need to call _hideActionPopup here, _handleInventoryClick will do it.
                // console.log('[Debug] Calling _hideActionPopup before showing new one.');
                // this._hideActionPopup(); // Hide any existing popup first
                console.log('[Debug] Calling _handleInventoryClick.');
                this._handleInventoryClick(clickedCharData, clickedChild, popupTargetX, popupTargetY);
                console.log('[Debug] Stopping propagation after handling inventory click.');
                event.stopPropagation(); // Prevent this click from triggering global listener

            } else {
                console.log('[Debug] Click detected on container, but not within any child bounds.');
                // Optionally hide popup if clicking empty space within the container
                // this._hideActionPopup();
            }

            // Note: We don't stop propagation here, allowing the global click listener
            // to potentially hide the popup if the click was outside the popup itself.
        });


        // Create a mask for the scrollable area
        const maskGraphics = this.make.graphics();
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(inventoryAreaX, inventoryAreaY, inventoryAreaWidth, inventoryAreaHeight); // Use local const
        const mask = maskGraphics.createGeometryMask();
        this.characterInventoryContainer.setMask(mask);

        // Add drag scrolling
        const scrollBounds = {
            minY: inventoryAreaY - (maxContentHeight > inventoryAreaHeight ? maxContentHeight - inventoryAreaHeight : 0), // Use local variable
            maxY: inventoryAreaY
        };

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            // Check if pointer is over the inventory area roughly
             if (pointer.y >= inventoryAreaY && pointer.y <= inventoryAreaY + inventoryAreaHeight) {
                let newY = this.characterInventoryContainer.y - deltaY * 0.5; // Adjust scroll speed as needed
                newY = Phaser.Math.Clamp(newY, scrollBounds.minY, scrollBounds.maxY);
                this.characterInventoryContainer.y = newY;
            }
        });

        // Optional: Add drag input for touch/mouse dragging (more complex)
        // this.characterInventoryContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, inventoryAreaWidth, maxContentHeight), Phaser.Geom.Rectangle.Contains);
        // this.input.setDraggable(this.characterInventoryContainer);
        // this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        //     if (gameObject === this.characterInventoryContainer) {
        //         let newY = gameObject.y + (pointer.y - pointer.prevPosition.y);
        //         newY = Phaser.Math.Clamp(newY, scrollBounds.minY, scrollBounds.maxY);
        //         gameObject.y = newY;
        // });

        // Populate initial team visuals AFTER inventory is set up
        this._populateInitialTeam(playerTeamSlotsData); // Pass the data fetched from GameDataManager


        // --- State Variables ---
        this.selectedInventoryCharacterData = null; // Holds the character data selected from inventory
        this.selectedInventoryDisplay = null; // Holds the display object selected from inventory
        this.isMovingState = false; // Flag to indicate if we are waiting for a team slot click
        this.actionPopup = null; // Reference to the Move/Inspect popup
        // REMOVED: this.popupJustClosedByButton = false;


        // --- Start Battle Button ---
        const startBattleButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 150, 'Start Battle', { fontSize: '64px', fill: '#ffffff' }) // Start white
            .setOrigin(0.5);
            // .setInteractive(); // Text is no longer directly interactive

        const buttonBounds = startBattleButton.getBounds();
        const buttonOutline = this.add.graphics();
        const buttonPadding = 5;
        const buttonHitArea = new Phaser.Geom.Rectangle(
            buttonBounds.x - buttonPadding,
            buttonBounds.y - buttonPadding,
            buttonBounds.width + 2 * buttonPadding,
            buttonBounds.height + 2 * buttonPadding
        );
        buttonOutline.lineStyle(2, 0xffffff, 1);
        buttonOutline.strokeRect(buttonHitArea.x, buttonHitArea.y, buttonHitArea.width, buttonHitArea.height);
        buttonOutline.setInteractive(buttonHitArea, Phaser.Geom.Rectangle.Contains);


        // Add hover effects
        let startBattleHoverTween = null;
        buttonOutline.on('pointerover', () => {
            startBattleButton.setFill('#00ff00'); // Bright green on hover
            if (startBattleHoverTween) startBattleHoverTween.stop();
            startBattleHoverTween = this.tweens.add({
                targets: startBattleButton,
                alpha: { from: 1, to: 0.5 },
                ease: 'Sine.easeInOut',
                duration: 300,
                repeat: -1,
                yoyo: true
            });
        });
        buttonOutline.on('pointerout', () => {
            startBattleButton.setFill('#ffffff'); // Back to white
            if (startBattleHoverTween) {
                startBattleHoverTween.stop();
                startBattleHoverTween = null;
            }
            startBattleButton.setAlpha(1);
        });

        buttonOutline.on('pointerdown', () => { // Listener on outline
            // --- Get Final Player Team Slot Data ---
            const finalTeamSlotData = this.playerTeamDisplays
                .map(displayObject => displayObject ? displayObject.data : null);

            // --- Save Final Team Composition (Slot Data) to GameDataManager ---
            GameDataManager.updateTeam(finalTeamSlotData);
            console.log("PreBattleSetupScene: Final team composition saved to GameDataManager.");

            // --- Prepare Player BattleCharacter Instances ---
            console.log("PreBattleSetupScene: Preparing player BattleCharacter instances...");
            const activePlayerTeamData = finalTeamSlotData.filter(charData => charData !== null); // Filter out empty slots

            if (activePlayerTeamData.length === 0) {
                console.error("Player team is empty. Cannot start battle.");
                // TODO: Show an error message to the player?
                return;
            }

            const preparedPlayerTeam = activePlayerTeamData.map(charData => {
                try {
                    if (!charData || !charData.definitionId) {
                        throw new Error("Invalid character data in final team slot");
                    }
                    // Create a new BattleCharacter for the battle
                    return new BattleCharacter(charData.definitionId, charData.level || 1, 'player');
                } catch (error) {
                    console.error(`Error creating BattleCharacter for player ${charData?.name}:`, error);
                    return null; // Skip if creation fails
                }
            }).filter(bc => bc !== null); // Filter out any creation failures

            if (preparedPlayerTeam.length === 0) {
                 console.error("Player battle team is empty after conversion failures. Cannot start battle.");
                 return;
            }
            if (preparedPlayerTeam.length < activePlayerTeamData.length) {
                 console.warn("Some player characters could not be prepared for battle.");
                 // Decide if battle should proceed with partial team? For now, it proceeds.
            }

            // --- Prepare Enemy BattleCharacter Instances (Already created in _loadAndDisplayBattleData) ---
            // Ensure this.currentEnemyTeam is populated correctly by _loadAndDisplayBattleData
            const preparedEnemyTeam = this.currentEnemyTeam || [];
            console.log("PreBattleSetupScene: Using prepared enemy BattleCharacter instances:", preparedEnemyTeam.map(c => c.name));

            if (preparedEnemyTeam.length === 0) {
                console.error("Enemy team is empty (check _loadAndDisplayBattleData). Cannot start battle.");
                // This indicates an issue earlier in the scene setup
                return;
            }

            // --- Store Prepared Teams in GameDataManager ---
            GameDataManager.setCurrentBattlePlayerTeam(preparedPlayerTeam);
            GameDataManager.setCurrentBattleEnemyTeam(preparedEnemyTeam);

            // --- Start Battle Scene (No data needed, it will pull from GameDataManager) ---
            console.log("Starting Battle Scene...");
            this.scene.start('BattleScene'); // No longer passing data
        });

        // Add a global click listener to hide the popup if clicking outside
        this.input.on('pointerdown', (pointer) => {
            console.log('[Debug] Global pointerdown detected.'); // <-- ADD LOG
            if (this.actionPopup && !this.isMovingState) {
                console.log('[Debug] Action popup exists and not in moving state.'); // <-- ADD LOG
                // Check if the click is outside the popup bounds
                const popupBounds = this.actionPopup.getBounds();
                if (!Phaser.Geom.Rectangle.Contains(popupBounds, pointer.worldX, pointer.worldY)) {
                     // Also check if the click was on the inventory item that opened the popup
                     const targetDisplay = this.actionPopup.getData('targetDisplay');
                     if (targetDisplay) {
                         const displayBounds = targetDisplay.getBounds();
                         if (!Phaser.Geom.Rectangle.Contains(displayBounds, pointer.worldX, pointer.worldY)) {
                             console.log('[Debug] Click outside target display bounds, hiding popup.'); // <-- ADD LOG
                             this._hideActionPopup();
                         } else {
                             console.log('[Debug] Click inside target display bounds, NOT hiding popup.'); // <-- ADD LOG
                         }
                     } else {
                         console.log('[Debug] Target display not set on popup, hiding popup.'); // <-- ADD LOG
                         this._hideActionPopup(); // Hide if targetDisplay isn't set (shouldn't happen)
                     }
                 } else {
                     console.log('[Debug] Click inside popup bounds, NOT hiding popup.'); // <-- ADD LOG
                 }
            } else {
                 if (!this.actionPopup) console.log('[Debug] Global click ignored: No action popup.');
                 if (this.isMovingState) console.log('[Debug] Global click ignored: In moving state.');
            }
        });

    } // End of create()

    /**
     * Called when returning to this scene to load the next battle's data.
     * DEPRECATED - Logic moved to wake()
     */
    updateBattleData() {
        console.warn("PreBattleSetupScene: updateBattleData() is deprecated. Use wake() event.");
        // Optionally, call wake directly if needed for compatibility, but ideally remove calls to this.
        // this.wake();
    }

    /**
     * Phaser Scene lifecycle method called when the Scene wakes up (e.g., after switching back).
     */
    wake() {
        console.log("PreBattleSetupScene: Waking up...");

        // --- Check Battle Outcome ---
        const lastBattleResult = GameDataManager.getLastBattleResult();
        console.log("[Wake Debug] lastBattleResult:", lastBattleResult); // <-- ADD LOG

        if (lastBattleResult !== GameDataManager.NO_BATTLE_RESULT && lastBattleResult.won === true) {
            console.log("[Wake Debug] Win condition met (lastBattleResult.won is true).");
            const battleIndex = GameDataManager.getCurrentBattleIndex(); // Get index of the completed battle

            // Award tickets
            const ticketReward = this._getTicketReward(battleIndex);
            console.log(`PreBattleSetupScene: Awarding ${ticketReward} tickets.`);
            GameDataManager.addTickets(ticketReward);

            // Transition to Reward Scene
            // BattleRewardScene will be responsible for clearing the lastBattleResult
            console.log("[Wake Debug] Attempting to start BattleRewardScene...");
            this.scene.start('BattleRewardScene', { battleIndex: battleIndex });
            console.log("[Wake Debug] this.scene.start('BattleRewardScene') called.");
            return; // Stop further execution in wake()
        } else {
            console.log("[Wake Debug] Win condition NOT met. Proceeding with next battle setup."); // <-- ADD LOG
            // --- If Lost or No Battle Result, Proceed with Setup for Next Battle ---
            console.log("PreBattleSetupScene: Player lost or no battle result, setting up next battle.");
        const battleIndex = GameDataManager.getCurrentBattleIndex();
        this._loadAndDisplayBattleData(battleIndex);
        // Refresh inventory visuals
        this._updateInventorySelectionVisuals();
        // Reset interaction states
        this._hideActionPopup();
        this.isMovingState = false;
        this.selectedInventoryCharacterData = null;
        this.selectedInventoryDisplay = null;
        console.log("PreBattleSetupScene: Wake update complete (for next battle setup).");
        } // <-- ADDED Missing closing brace for the 'else' block
    }


    // Removed displayCharacterInfo as it's replaced by the new interaction model

    // --- Helper Functions ---

    /**
     * Calculates the number of tickets to award for winning a specific battle.
     * @param {number} battleIndex - The index of the battle that was won.
     * @returns {number} The number of tickets awarded.
     */
    _getTicketReward(battleIndex) {
        // TODO: Implement logic based on battleIndex later
        console.log(`_getTicketReward called for battleIndex: ${battleIndex}`);
        return 2; // Fixed reward for now
    }

    _populateInitialTeam(playerTeamSlotsData) {
        // Place characters from the globally stored team slots into the visual slots
        playerTeamSlotsData.forEach((charData, index) => {
            // charData will be the character object from inventory or null
            if (index < this.playerTeamSlots.length) { // Always attempt to update, even if charData is null (to clear visuals)
                this._updateTeamSlotVisual(index, charData);
            }
        });
        // Mark corresponding inventory characters as 'selected' (checkmark)
        this._updateInventorySelectionVisuals();
    }

    _handleInventoryClick(characterData, MenuCharacterDisplay, clickX, clickY) {
        console.log(`[Debug] === _handleInventoryClick START for: ${characterData.name} ===`);
        // Hide popup *only if* one already exists. Showing a new one handles the replacement.
        if (this.actionPopup) {
             this._hideActionPopup();
        }
        console.log('Clicked inventory character:', characterData.name);
        // Don't select if already in the team // This comment is now outdated by subsequent changes
        const isInTeam = this.playerTeamDisplays.some(displayObj => displayObj && displayObj.data === characterData);

        // Always allow showing the popup, but the 'Move' action will differ
        this.selectedInventoryCharacterData = characterData;
        this.selectedInventoryDisplay = MenuCharacterDisplay;
        // The third argument (clickX, clickY) determines popup position.
        // The 'inspectOnly' flag is removed; _showActionPopup will determine context.
        this._showActionPopup(characterData, MenuCharacterDisplay, clickX, clickY);

        // Note: The logic inside _showActionPopup's Move button handler will now
        // need to check if the character is already in the team to decide whether
        // to initiate a move *to* the team or trigger a move *from* the team.

        /* // Original logic commented out for reference
        if (isInTeam) {
            console.log(`${characterData.name} is already in the team.`);
             // Allow inspect even if in team
             this.selectedInventoryCharacterData = characterData;
             this.selectedInventoryDisplay = MenuCharacterDisplay;
             this._showActionPopup(characterData, MenuCharacterDisplay, clickX, clickY, true); // Pass flag to only show inspect
            return;
        }
        */

        // REMOVED: Redundant call to _showActionPopup and related state setting
        // // These lines were part of the original 'else' block, now handled above unconditionally
        // // this.selectedInventoryCharacterData = characterData; // Already set above
        // // this.selectedInventoryDisplay = MenuCharacterDisplay; // Already set above
        // this._showActionPopup(characterData, MenuCharacterDisplay, clickX, clickY); // Already called above
    }
    _showActionPopup(characterData, displayObject, clickX, clickY, isEnemyInspection = false) {
        console.log(`[Debug] _showActionPopup called for ${characterData.name}. Is Enemy: ${isEnemyInspection}`);

        // REMOVED: Disable background interactivity logic (Ensuring removal)

        // Determine if the character is currently in the team (only relevant for player characters)
        let isInTeam = false;
        if (!isEnemyInspection) {
            isInTeam = this.playerTeamDisplays.some(displayObj => displayObj && displayObj.data === characterData);
            console.log(`[Debug _showActionPopup] Is ${characterData.name} in player team? ${isInTeam}`);
        }


        // Determine button configuration
        const buttonsToShow = [];
        if (isEnemyInspection) {
            buttonsToShow.push({ text: 'Inspect', color: '#FFFFFF', action: 'inspect' });
        } else {
            // For player characters (from inventory or team slot)
            const showMove = true; // Always show move option for player characters
            if (showMove) {
                buttonsToShow.push({ text: 'Move', color: '#FFFFFF', action: 'move' }); // Initial color white
            }
            buttonsToShow.push({ text: 'Inspect', color: '#FFFFFF', action: 'inspect' }); // Initial color white
        }


        const numberOfButtons = buttonsToShow.length;
        const popupWidth = 100; // Keep fixed width for now
        // Calculate height based *only* on buttons filling the space
        const calculatedButtonHeight = 40; // Fixed height per button for simplicity
        const popupHeight = numberOfButtons * calculatedButtonHeight;
        // Position popup near the click, adjusting if near edge
        const targetPopupX = clickX + 10;
        const targetPopupY = clickY + 10;
        const popupX = Math.min(targetPopupX, this.cameras.main.width - popupWidth);
        const popupY = Math.min(targetPopupY, this.cameras.main.height - popupHeight);
        console.log(`[Debug _showActionPopup] Click(X=${clickX.toFixed(1)}, Y=${clickY.toFixed(1)}), TargetPopup(X=${targetPopupX.toFixed(1)}, Y=${targetPopupY.toFixed(1)}), FinalPopup(X=${popupX.toFixed(1)}, Y=${popupY.toFixed(1)})`); // <-- ADD LOG


        // Create a container for the popup elements
        this.actionPopup = this.add.container(popupX, popupY);
        // Link popup to the display object that triggered it
        this.actionPopup.setData('targetDisplay', displayObject); // Use consistent key 'targetDisplay'
        this.actionPopup.setData('characterData', characterData); // Store character data directly

        // Background
        const background = this.add.graphics();
        // Use the height calculated based on the number of buttons
        background.fillStyle(0x222222, 0.9);
        background.fillRect(0, 0, popupWidth, popupHeight); // Use calculated popupHeight
        background.lineStyle(1, 0xffffff, 1);
        background.strokeRect(0, 0, popupWidth, popupHeight); // Use calculated popupHeight
        this.actionPopup.add(background);

        // Make background interactive to catch clicks within the popup area
        background.setInteractive(new Phaser.Geom.Rectangle(0, 0, popupWidth, popupHeight), Phaser.Geom.Rectangle.Contains);
        background.on('pointerdown', (pointer, localX, localY, event) => {
            console.log('[Debug] Click caught by popup background. Stopping propagation.');
            event.stopPropagation();
        });


        // Create buttons dynamically
        let currentY = 0; // Start buttons from the top

        buttonsToShow.forEach(buttonInfo => {
            const buttonY = currentY;
            const buttonHeight = calculatedButtonHeight; // Use calculated height

            console.log(`[Debug] Adding "${buttonInfo.text}" button.`);

            // Button Background Rectangle (Interactive Area)
            const buttonBg = this.add.rectangle(0, buttonY, popupWidth, buttonHeight, 0x333333)
                .setOrigin(0, 0)
                .setInteractive();
            this.actionPopup.add(buttonBg);

            // Button Text (Visual Only)
            const buttonText = this.add.text(popupWidth / 2, buttonY + buttonHeight / 2, buttonInfo.text, { fontSize: '18px', fill: buttonInfo.color })
                .setOrigin(0.5, 0.5);
            this.actionPopup.add(buttonText);

            let buttonHoverTween = null;

            buttonBg.on('pointerover', () => {
                buttonText.setFill('#00FF00'); // Green on hover
                if (buttonHoverTween) buttonHoverTween.stop();
                buttonHoverTween = this.tweens.add({
                    targets: buttonText,
                    alpha: { from: 1, to: 0.5 },
                    ease: 'Sine.easeInOut',
                    duration: 300,
                    repeat: -1,
                    yoyo: true
                });
            });

            buttonBg.on('pointerout', () => {
                buttonText.setFill('#FFFFFF'); // Revert to white
                if (buttonHoverTween) {
                    buttonHoverTween.stop();
                    buttonHoverTween = null;
                }
                buttonText.setAlpha(1);
            });

            // Add listener to the background rectangle
            buttonBg.on('pointerdown', (pointer, localX, localY, event) => {
                console.log(`[Debug] ${buttonInfo.text} button clicked.`);
                event.stopPropagation(); // IMPORTANT: Stop click from reaching elements below popup

                // Hide the popup FIRST
                this._hideActionPopup();

                // Perform the action based on buttonInfo
                if (buttonInfo.action === 'move') { // This block will only be reached if !isEnemyInspection
                    if (isInTeam) {
                        console.log(`[Debug] Calling _handleMoveFromTeamClick for ${characterData.name}`);
                        this._handleMoveFromTeamClick(characterData);
                    } else {
                        console.log(`[Debug] Calling _handleMoveToTeamClick for ${characterData.name}`);
                        // displayObject here is the MenuCharacterDisplay from inventory
                        this._handleMoveToTeamClick(characterData, displayObject);
                    }
                } else if (buttonInfo.action === 'inspect') {
                    console.log(`[Debug] Calling _handleInspectClick for ${characterData.name}`);
                    // Ensure characterData passed to inspect has the definition
                    // For enemies, this.currentEnemyTeam stores BattleCharacter instances which should have .definition
                    // For player characters, characterData from inventory/team slots should also have .definition
                    let charDataForInspect = characterData;
                    if (!charDataForInspect.definition && charDataForInspect.definitionId) {
                        console.warn(`[Debug _showActionPopup] Character ${charDataForInspect.name} missing definition, attempting to fetch for inspect.`);
                        const freshDef = getCharacterDefinition(charDataForInspect.definitionId);
                        if (freshDef) {
                            // Create a temporary object or clone if necessary to avoid modifying original BattleCharacter/MenuCharacter
                            // For now, directly attaching, assuming CharacterProfileScene handles it well.
                            charDataForInspect = { ...charDataForInspect, definition: freshDef };
                        } else {
                            console.error(`[Debug _showActionPopup] Could not fetch definition for ${charDataForInspect.definitionId}. Inspect might fail.`);
                        }
                    }
                    this._handleInspectClick(charDataForInspect);
                }
            });

            currentY += buttonHeight; // Move Y position for the next button
        });


        // Bring popup to top
        this.actionPopup.setDepth(10); // Ensure popup is above other UI
    }

    _hideActionPopup() {
        console.log(`[Debug] === _hideActionPopup START. Current this.actionPopup: ${this.actionPopup ? 'Exists' : 'null'}. isMovingState: ${this.isMovingState} ===`);
        const popupExisted = !!this.actionPopup; // Track if popup was actually open

        if (this.actionPopup) {
            console.log('[Debug] Popup exists. Attempting destroy...');
            try {
                this.actionPopup.destroy();
                console.log('[Debug] Popup destroyed successfully.');
                this.actionPopup = null;
            } catch (error) {
                console.error('[Debug] Error destroying popup:', error);
                // Force null even if destroy failed, might hide visual glitches
                this.actionPopup = null;
            }
        } else {
             console.log('[Debug] _hideActionPopup called, but no popup exists.');
        }

        // REMOVED: Re-enable background interactivity logic

        // Reset selection state if not entering move mode
        if (!this.isMovingState) {
             this.selectedInventoryCharacterData = null;
             this.selectedInventoryDisplay = null;
        }
    }
    // Renamed from _handleMoveClick - handles initiating move TO team
    _handleMoveToTeamClick(characterData, inventoryDisplay) {
        if (!characterData) return;
        console.log('Move TO team selected for:', characterData.name);
        this.selectedInventoryCharacterData = characterData; // Set the character to be moved
        this.selectedInventoryDisplay = inventoryDisplay; // Set the corresponding inventory display
        this.isMovingState = true;
        // Visual cue: highlight team slots
        this.playerTeamSlots.forEach(slot => slot.setStrokeStyle(3, 0x00ff00)); // Highlight slots
        // REMOVED: this._hideActionPopup(); // Now handled by the button listener itself
    }

     // New function to handle moving FROM team
    _handleMoveFromTeamClick(characterData) {
        if (!characterData) return;
        console.log(`Move FROM team selected for: ${characterData.name}`);

        // Find the team slot this character is in
        const slotIndex = this.playerTeamDisplays.findIndex(displayObj => displayObj && displayObj.data === characterData);

        if (slotIndex !== -1) {
            console.log(`${characterData.name} found in team slot ${slotIndex}. Removing.`);
            // Remove character from the visual team slot
            this._updateTeamSlotVisual(slotIndex, null);

            // Update GameDataManager with the new team state
            const currentTeamData = this.playerTeamDisplays.map(display => display ? display.data : null);
            GameDataManager.updateTeam(currentTeamData);

            // Update inventory visuals (remove checkmark/gray-out)
            this._updateInventorySelectionVisuals();
        } else {
            console.warn(`Could not find ${characterData.name} in the team display array.`);
        }

        // REMOVED: this._hideActionPopup(); // Now handled by the button listener itself
    }


    _handleInspectClick(characterData) {
        if (!characterData) return;
        console.log('PreBattleSetupScene: Inspect selected for:', characterData.name, '. Launching CharacterProfileScene.');

        // Pass the character data and the key of the current scene
        this.scene.sleep('PreBattleSetupScene'); // Sleep current scene
        this.scene.launch('CharacterProfileScene', {
            characterData: characterData,
            previousSceneKey: 'PreBattleSetupScene'
        });

        this._hideActionPopup(); // Ensure popup is hidden after action
    }

    _handleTeamMemberClick(icon, pointer) {
        const characterData = icon.getData('characterData');
        if (!characterData) return;

        console.log('Clicked team member:', characterData.name);
        this._hideActionPopup(); // Hide any existing popup first
        // Show popup for player team member
        // Pass 'icon' as the display object, and false for isEnemyInspection
        this._showActionPopup(characterData, icon, pointer.worldX, pointer.worldY, false);
    }

    _handleEnemyIconClick(enemyIcon, pointer) {
        const characterData = enemyIcon.getData('characterData'); // This is a BattleCharacter instance
        if (!characterData) {
            console.error("Enemy icon clicked, but no characterData found.", enemyIcon);
            return;
        }
        console.log('Clicked enemy icon:', characterData.name);
        this._hideActionPopup(); // Hide any existing popup first

        // Show popup for enemy, only with "Inspect" option
        // Pass 'enemyIcon' as the display object, and true for isEnemyInspection
        this._showActionPopup(characterData, enemyIcon, pointer.worldX, pointer.worldY, true);
    }


     _handleTeamSlotClick(slotIndex) {
        console.log(`[Debug] === _handleTeamSlotClick START for index: ${slotIndex}. isMovingState: ${this.isMovingState} ===`); // <-- ADDED START LOG
        // This function is for clicking the empty slot rectangle *during* a move operation
        if (this.isMovingState && this.selectedInventoryCharacterData) {
            // --- Moving TO a slot ---
            console.log(`Attempting to move ${this.selectedInventoryCharacterData.name} to slot ${slotIndex}`);

            const previouslySelectedData = this.selectedInventoryCharacterData;
            const previouslySelectedDisplay = this.selectedInventoryDisplay;

            // Check if the target slot is already occupied
            const currentCharacterInSlotDisplayObj = this.playerTeamDisplays[slotIndex];
            const currentCharacterInSlotData = currentCharacterInSlotDisplayObj ? currentCharacterInSlotDisplayObj.data : null;

            // --- Logic ---
            // 1. Place selected character visually in the slot
            this._updateTeamSlotVisual(slotIndex, previouslySelectedData);

            // 2. If slot was occupied, move the previous character back to inventory (conceptually)
            //    - Visual update handled below by _updateInventorySelectionVisuals
            if (currentCharacterInSlotData) {
                 console.log(`Slot ${slotIndex} occupied by ${currentCharacterInSlotData.name}. Returning to inventory.`);
            }

            // 3. Mark the newly placed character's inventory display as 'selected' (checkmark) - Handled by _updateInventorySelectionVisuals

            // --- Update GameDataManager ---
            const currentTeamData = this.playerTeamDisplays.map(display => display ? display.data : null);
            GameDataManager.updateTeam(currentTeamData);

            // --- Cleanup & Visual Update ---
            this.isMovingState = false;
            this.selectedInventoryCharacterData = null; // Clear selection after move
            this.selectedInventoryDisplay = null;
            this.playerTeamSlots.forEach(slot => slot.setStrokeStyle(2, 0xffffff)); // Reset slot highlight
            this._hideActionPopup(); // Ensure popup is hidden
            this._updateInventorySelectionVisuals(); // Update all checkmarks/gray-out states

            console.log(`Moved ${previouslySelectedData.name} to slot ${slotIndex}.`);

        } else if (!this.isMovingState) {
            // --- Clicking when NOT moving ---
            const characterDisplayInSlot = this.playerTeamDisplays[slotIndex]; // Get the display object or null
            const characterDataInSlot = characterDisplayInSlot ? characterDisplayInSlot.data : null;

            if (characterDataInSlot) {
                // REMOVED: Check for popupJustClosedByButton flag

                // Clicked an occupied slot: Show action popup for this character
                console.log(`Clicked occupied team slot ${slotIndex} with ${characterDataInSlot.name}. Showing popup.`);

                // Get world coordinates of the slot center for popup positioning
                const slotObject = this.playerTeamSlots[slotIndex];
                const worldMatrix = slotObject.getWorldTransformMatrix();
                const worldX = worldMatrix.tx;
                const worldY = worldMatrix.ty;

                // Hide popup *only if* one already exists. Showing a new one handles the replacement.
                if (this.actionPopup) {
                    this._hideActionPopup();
                }
                // Show popup for the character in the team slot.
                // Pass the character data, the display object *in the slot*, slot position, and false for isEnemyInspection.
                this._showActionPopup(characterDataInSlot, characterDisplayInSlot, worldX, worldY, false);
                console.log('[Debug] Stopping propagation after showing popup from team slot.');
                if (event) event.stopPropagation(); // Prevent this click from triggering global listener

            } else {
                // Clicked an empty slot when not moving - do nothing.
                console.log(`Clicked empty team slot ${slotIndex} while not in moving state.`);
                // Hide any inventory popup if an empty slot was clicked.
                 this._hideActionPopup();
            }
        } else {
             // Catch case: isMovingState is true but no character selected (shouldn't happen)
             console.log("In move state but no character selected.");
             this.isMovingState = false; // Reset state
             this.playerTeamSlots.forEach(slot => slot.setStrokeStyle(2, 0xffffff)); // Reset highlight
             this._hideActionPopup();
        }
    }
    _updateInventorySelectionVisuals() {
        console.log("Updating inventory selection visuals (gray-out only)...");

        this.characterInventoryDisplays.forEach(invDisplay => {
            const charData = invDisplay.getData('characterData');
            if (!charData || typeof invDisplay.setGrayedOut !== 'function') {
                // console.warn("Character data or setGrayedOut method missing for an inventory display.", invDisplay);
                return;
            }

            // Use GameDataManager.isCharacterInTeam for a more direct check
            const isInTeam = GameDataManager.isCharacterInTeam(charData);

            if (isInTeam) {
                console.log(`  - ${charData.name} is in team (should be grayed out).`);
                invDisplay.setGrayedOut(true);
            } else {
                console.log(`  - ${charData.name} is not in team (should not be grayed out).`);
                invDisplay.setGrayedOut(false);
            }
        });
    }

    _updateTeamSlotVisual(slotIndex, characterData) {
        // Clear existing character icon/text in the slot if any
        if (this.playerTeamDisplays[slotIndex]) {
            if (this.playerTeamDisplays[slotIndex].icon) this.playerTeamDisplays[slotIndex].icon.destroy();
            if (this.playerTeamDisplays[slotIndex].text) this.playerTeamDisplays[slotIndex].text.destroy();
            this.playerTeamDisplays[slotIndex] = null;
        }

        if (!characterData) {
             console.log(`Slot ${slotIndex} is now empty.`);
             return; // Nothing more to do if the slot is empty
        }

        const slot = this.playerTeamSlots[slotIndex]; // Use the slot rectangle for position
        const definition = characterData.definition;

        if (!definition) {
            console.error(`Cannot update slot ${slotIndex}: Character data missing definition!`, characterData);
            // Optionally add placeholder text
            const errorText = this.add.text(slot.x, slot.y, 'ERR', { fontSize: '40px', fill: '#f00' }).setOrigin(0.5);
            this.playerTeamDisplays[slotIndex] = { icon: errorText, data: characterData };
            return;
        }

        const faceIconKey = definition.faceIconKey || 'default_character_icon';
        // --- DEBUG LOG ---
        if (definition.id === 'elzette') {
            console.log(`[_updateTeamSlotVisual Debug] Using faceIconKey for Elzette: '${faceIconKey}'`);
        }

        console.log(`Checking texture for slot ${slotIndex}: Key='${faceIconKey}', Exists=${this.textures.exists(faceIconKey)}`);
        if (this.textures.exists(faceIconKey)) {
            const icon = this.add.image(slot.x, slot.y, faceIconKey);
            icon.setDisplaySize(99, 99); // Resize the icon to fill the 100x100 slot
            icon.setInteractive();
            icon.setData('characterData', characterData);
            icon.on('pointerdown', (pointer) => {
                 if (this.actionPopup && this.actionPopup.getData('targetDisplay') === icon) return;
                 this._hideActionPopup();
                 this._handleTeamMemberClick(icon, pointer);
             });
            console.log(`Created icon for slot ${slotIndex} (${characterData.name}): Key='${icon.texture.key}', Visible=${icon.visible}, X=${icon.x}, Y=${icon.y}, Depth=${icon.depth}`);
            // Store only the icon and data (remove separate text for now)
            this.playerTeamDisplays[slotIndex] = { icon: icon, data: characterData };
        } else {
            console.error(`Texture key "${faceIconKey}" not found for character ${characterData.name} in slot ${slotIndex}.`);
            // Add placeholder text if icon fails
            const errorText = this.add.text(slot.x, slot.y, '?', { fontSize: '40px', fill: '#f00' }).setOrigin(0.5);
            this.playerTeamDisplays[slotIndex] = { icon: errorText, data: characterData }; // Store text as 'icon' for cleanup
        }
    }
/**
     * Loads enemy data for the given battle index and updates the display.
     * @param {number} battleIndex - The index of the battle to load from battles.json.
     */
    _loadAndDisplayBattleData(battleIndex) {
        console.log(`PreBattleSetupScene: Loading data for battle index ${battleIndex}`);

        // --- Destroy Previous Battle Title and Enemy Visuals/Group ---
        if (this.battleTitleText) {
            this.battleTitleText.destroy();
            this.battleTitleText = null;
        }
        if (this.enemyDisplayGroup) {
            console.log("Destroying existing enemyDisplayGroup.");
            this.enemyDisplayGroup.destroy(true); // Destroy the group and its children
        }
        // Always create a new group for the current battle's display objects
        this.enemyDisplayGroup = this.add.group();
        console.log("Created new enemyDisplayGroup.");

        // --- Load Battle Data ---
        if (battleIndex >= battlesData.length) {
            console.error(`Invalid battleIndex: ${battleIndex}. No more battles defined.`);
            // TODO: Handle end of battles - maybe transition to EndGameScene?
            this.scene.start('MenuScreenScene'); // Go back to menu for now
            return;
        }
        const currentBattle = battlesData[battleIndex];

        // --- Display Centered Battle Title ---
        const titleStyle = { fontSize: '64px', fill: '#fff', align: 'center' };
        this.battleTitleText = this.add.text(
            this.cameras.main.width / 2,
            50, // Position near the top
            `Battle ${currentBattle.battleId}`,
            titleStyle
        ).setOrigin(0.5);

        // --- Create Enemy Team using BattleCharacter and Definitions ---
        console.log(`Creating enemies for Battle Index: ${battleIndex}, Battle ID: ${currentBattle.battleId}`);
        this.currentEnemyTeam = currentBattle.enemies.map((enemyConfig, index) => {
            const definitionId = enemyConfig.type.toLowerCase();
            const definition = getCharacterDefinition(definitionId);
            if (!definition) {
                console.error(`Character definition not found for enemy type: ${enemyConfig.type}. Skipping enemy.`);
                return null;
            }
            const battleCharacter = new BattleCharacter(definitionId, 1, 'enemy');
            console.log(`Created BattleCharacter: ${battleCharacter.getName()}`);
            // TODO: Assign unique IDs if needed
            return battleCharacter;
        }).filter(character => character !== null);

        // --- Display Enemy Team ---
        // Store title reference if we need to update it later
        this.enemyTeamTitle = this.add.text(1450, 150, `Enemy Team`, { fontSize: '48px', fill: '#fff' }).setOrigin(0.5, 0); // Centered above enemy slots
        this.enemyDisplayGroup.add(this.enemyTeamTitle); // Add title to the group

        const camWidth = this.cameras.main.width;
        const enemySlotPositions = [
            { x: camWidth - 800, y: 250 }, // Slot 1 (Rightmost for enemy, mirrors player's leftmost)
            { x: camWidth - 650, y: 250 }, // Slot 2
            { x: camWidth - 500, y: 250 }, // Slot 3
            { x: camWidth - 350, y: 250 }, // Slot 4
            { x: camWidth - 200, y: 250 }  // Slot 5 (Leftmost for enemy, mirrors player's rightmost)
        ];

        this.currentEnemyTeam.forEach((character, index) => {
            if (index < enemySlotPositions.length && character) {
                const pos = enemySlotPositions[index];
                // Use enemy icon
                const enemyIcon = this.add.image(pos.x, pos.y, 'enemy_icon');
                enemyIcon.setDisplaySize(99, 99);
                enemyIcon.setInteractive(); // Make enemy icon interactive
                enemyIcon.setData('characterData', character); // Store the BattleCharacter instance

                enemyIcon.on('pointerdown', (pointer) => {
                    // Prevent opening multiple popups for the same enemy if already open
                    if (this.actionPopup && this.actionPopup.getData('targetDisplay') === enemyIcon) {
                        console.log(`[Debug] Click ignored, popup already open for enemy ${character.name}`);
                        return;
                    }
                    this._handleEnemyIconClick(enemyIcon, pointer);
                    if (event) event.stopPropagation(); // Stop propagation if event is available
                });
                
                // Optional: Add name text below icon
                const enemyNameText = this.add.text(pos.x, pos.y + 60, character.name, { fontSize: '16px', fill: '#fff', align: 'center' }).setOrigin(0.5);
                // Keep the red box for now, or remove if icon is sufficient
                const enemySlotRect = this.add.rectangle(pos.x, pos.y, 100, 100).setStrokeStyle(2, 0xff0000);

                // Add all created display objects to the group individually
                if (enemyIcon) this.enemyDisplayGroup.add(enemyIcon);
                if (enemyNameText) this.enemyDisplayGroup.add(enemyNameText);
                if (enemySlotRect) this.enemyDisplayGroup.add(enemySlotRect);
            }
        });
        console.log(`PreBattleSetupScene: Display updated for battle index ${battleIndex}`);
    }


    update() {
        // Update logic if needed (e.g., for scrolling)
    }
}

export default PreBattleSetupScene;