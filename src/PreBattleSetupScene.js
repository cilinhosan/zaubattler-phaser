import Phaser from 'phaser';
import battlesData from './game/battles.json'; // Import battle data
import BattleCharacter from './game/BattleCharacter.js'; // Use BattleCharacter for enemies in this scene
import { getCharacterDefinition } from './CharacterDefinitionList.js'; // Corrected import path
// TODO: Check if MenuCharacter is needed here if playerTeam needs inspection/display beyond base stats
// import MenuCharacter from './game/MenuCharacter.js';
// import { fireBlastSkill, atkBoostPassive } from './game/SkillDefinitions.js'; // Removed unused skill imports
import MenuCharacterDisplay from './game/MenuCharacterDisplay.js'; // Import MenuCharacterDisplay
import GameDataManager from './game/GameDataManager.js'; // Import the GameDataManager singleton


class PreBattleSetupScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreBattleSetupScene' });
    }

    init(data) {
        // Store battle index. Team and inventory are fetched from GameDataManager.
        this.battleIndex = data.battleIndex || 0;
    }

    preload() {
        // --- Load Default Icons ---
        const defaultFaceIconKey = 'default_character_icon';
        const defaultBattleIconKey = 'default_battle_icon';
        const defaultEnemyIconKey = 'enemy_icon'; // Keep separate default for enemies for now

        this.load.image(defaultFaceIconKey, 'assets/default_character_ilustration_face_icon.png');
        this.load.image(defaultBattleIconKey, 'assets/default_character_ilustration_4_3.png');
        this.load.image(defaultEnemyIconKey, 'assets/default_enemy_illustration_face_icon.png'); // Load default enemy face icon

        // --- Preload Specific Character Icons (Face and Battle) ---
        const loadedIconKeys = new Set([defaultFaceIconKey, defaultBattleIconKey, defaultEnemyIconKey]);

        // Fetch inventory and team from manager for preloading icons
        const currentInventory = GameDataManager.getInventory();
        const currentTeamSlots = GameDataManager.getTeamSlots(); // Get slots (includes nulls)
        const charactersToCheck = [...currentInventory, ...currentTeamSlots.filter(c => c !== null)]; // Combine inventory and non-null team members

        charactersToCheck.forEach(charData => {
            const definition = charData?.definition;
            if (!definition) {
                console.warn(`Character data in inventory/team missing definition.`);
                return; // Skip if no definition
            }

            // Preload specific Face Icon
            if (definition.faceIconKey && definition.faceIconPath &&
                definition.faceIconKey !== defaultFaceIconKey &&
                !loadedIconKeys.has(definition.faceIconKey))
            {
                // --- DEBUG LOG ---
                if (definition.id === 'elzette') { // Log specifically for Elzette
                    console.log(`[Preload Debug] Attempting to load Elzette face icon: Key='${definition.faceIconKey}', Path='${definition.faceIconPath}'`);
                }
                console.log(`Preloading specific face icon: ${definition.faceIconKey} from ${definition.faceIconPath}`);
                this.load.image(definition.faceIconKey, definition.faceIconPath);
                loadedIconKeys.add(definition.faceIconKey);
            } else if (definition.faceIconKey && definition.faceIconKey !== defaultFaceIconKey && !definition.faceIconPath) {
                 console.warn(`Character ${charData.name} has specific faceIconKey '${definition.faceIconKey}' but no faceIconPath defined.`);
            }

            // Preload specific Battle Icon
            if (definition.battleIconKey && definition.battleIconPath &&
                definition.battleIconKey !== defaultBattleIconKey &&
                !loadedIconKeys.has(definition.battleIconKey))
            {
                console.log(`Preloading specific battle icon: ${definition.battleIconKey} from ${definition.battleIconPath}`);
                this.load.image(definition.battleIconKey, definition.battleIconPath);
                loadedIconKeys.add(definition.battleIconKey);
            } else if (definition.battleIconKey && definition.battleIconKey !== defaultBattleIconKey && !definition.battleIconPath) {
                 console.warn(`Character ${charData.name} has specific battleIconKey '${definition.battleIconKey}' but no battleIconPath defined.`);
            }
        });

        // Note: Enemy icons are currently handled separately using 'enemy_icon'.
        // If enemies need specific icons later, similar logic would apply to enemyTeam data.
    }

    create(data) {
        // this.add.image(400, 300, 'background'); // Add background if you have one

        // Use data stored in init()
        // Get current team slots and inventory from the GameDataManager
        const playerTeamSlotsData = GameDataManager.getTeamSlots(); // Array with character data or nulls
        const playerInventory = GameDataManager.getInventory();
        const battleIndex = this.battleIndex;

        // --- Load Enemy Team based on battleIndex ---
        if (battleIndex >= battlesData.length) {
            console.error(`Invalid battleIndex: ${battleIndex}. No more battles defined.`);
            // Optionally, transition to an error scene or back to menu
            this.scene.start('MenuScreenScene');
            return;
        }

        const currentBattle = battlesData[battleIndex];

        // --- Create Enemy Team using BattleCharacter and Definitions ---
        console.log(`Creating enemies for Battle Index: ${battleIndex}, Battle ID: ${currentBattle.battleId}`);
        const enemyTeam = currentBattle.enemies.map((enemyConfig, index) => {
            console.log(`Processing enemy config:`, enemyConfig);
            const definitionId = enemyConfig.type.toLowerCase(); // Assuming type matches definition ID
            console.log(`Attempting to get definition for ID: ${definitionId}`);
            const definition = getCharacterDefinition(definitionId);

            if (!definition) {
                console.error(`Character definition not found for enemy type: ${enemyConfig.type}. Skipping enemy.`);
                // Consider adding a placeholder 'Unknown Enemy' BattleCharacter
                return null; // Skip this enemy if definition is missing
            }

            // Create BattleCharacter instance using the definition ID
            // Level and team are set here. Skills and passives are handled by the constructor.
            console.log(`Definition found for ${definitionId}. Creating BattleCharacter...`);
            const battleCharacter = new BattleCharacter(definitionId, 1, 'enemy'); // Level 1, enemy team
            console.log(`Created BattleCharacter: ${battleCharacter.getName()}`);

            // TODO: Potentially assign unique IDs or modify names if needed (e.g., "Goblin A", "Goblin B")
            // battleCharacter.name = `${definition.name} ${index + 1}`; // Example: Rename to Goblin 1, Goblin 2

            return battleCharacter;
        }).filter(character => character !== null); // Filter out any nulls from missing definitions
        // --- End Load Enemy Team ---


        // --- New Layout Setup ---

        // Player Team Slots (Mid-Top Left)
        this.add.text(200, 150, 'Your Team', { fontSize: '48px', fill: '#fff' });
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

        // Enemy Team Display (Mid-Top Right)
        this.add.text(1200, 150, `Enemy Team (Battle ${currentBattle.battleId})`, { fontSize: '48px', fill: '#fff' });
        const enemySlotPositions = [
            { x: 1200, y: 250 },
            { x: 1350, y: 250 },
            { x: 1500, y: 250 },
             // Add more slots if needed
        ];
     enemyTeam.forEach((character, index) => {
        if (index < enemySlotPositions.length && character) {
            const pos = enemySlotPositions[index];
            // Use enemy icon
            const enemyIcon = this.add.image(pos.x, pos.y, 'enemy_icon');
            enemyIcon.setDisplaySize(90, 90); // Resize the icon
            enemyIcon.setDisplaySize(90, 90); // Resize the icon
            // Optional: Add name text below icon
            this.add.text(pos.x, pos.y + 60, character.name, { fontSize: '16px', fill: '#fff', align: 'center' }).setOrigin(0.5);
            // Keep the red box for now, or remove if icon is sufficient
             this.add.rectangle(pos.x, pos.y, 100, 100).setStrokeStyle(2, 0xff0000);
        }
    });


        // --- Scrollable Player Inventory ---
        const inventoryTitleText = this.add.text(this.cameras.main.width / 2, 450, 'Member Reserve', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        const textBottomY = inventoryTitleText.y + inventoryTitleText.height * (1 - inventoryTitleText.originY); // Calculate bottom based on origin
        console.log(`[Debug Layout] Inventory Title Text Bottom Y: ${textBottomY.toFixed(1)}`); // <-- ADD LOG

        // --- Calculate Inventory Area Position ---
        const inventoryPaddingY = 20; // Space between title and inventory area
        const inventoryAreaY = textBottomY + inventoryPaddingY;
        console.log(`[Debug Layout] Calculated inventoryAreaY: ${inventoryAreaY}`); // <-- ADD LOG

        this.inventoryDisplays = []; // Array to hold MenuCharacterDisplay objects for inventory
        this.inventoryCharacterData = playerInventory; // Store the raw inventory data

        const inventoryAreaX = 50;
        // inventoryAreaY is now calculated above
        const inventoryAreaWidth = this.cameras.main.width - 100; // Back to local const
        const inventoryAreaHeight = 300; // Visible height

        // Create a container for all inventory items
        this.inventoryContainer = this.add.container(inventoryAreaX, inventoryAreaY);

        // Simple grid layout within the container
        const inventoryStartX = 50; // Relative to container
        const inventoryStartY = 20; // Relative to container
        const inventorySpacingX = 150; // Increased horizontal spacing
        const inventorySpacingY = 170; // Increased vertical spacing (box is 100, text adds ~25)
        const itemsPerRow = Math.floor((inventoryAreaWidth - inventoryStartX * 2) / inventorySpacingX); // Use local const
        let maxContentHeight = 0; // Back to local variable (use let as it's reassigned)

        this.inventoryCharacterData.forEach((charData, index) => {
            const gridX = index % itemsPerRow;
            const gridY = Math.floor(index / itemsPerRow);
            const displayX = inventoryStartX + gridX * inventorySpacingX;
            const displayY = inventoryStartY + gridY * inventorySpacingY;

            const charDisplay = new MenuCharacterDisplay(this, displayX, displayY, charData);
            // charDisplay.setInteractive(); // REMOVED - Let MenuCharacterDisplay handle its own interaction setup

            // Store the display object and link it to the data
            this.inventoryDisplays.push(charDisplay);
            charDisplay.setData('characterData', charData);
            charDisplay.setData('inventoryIndex', index);

            // REMOVED individual item listener

            // Add the display to the container
            this.inventoryContainer.add(charDisplay);

            maxContentHeight = Math.max(maxContentHeight, displayY + charDisplay.height); // Use local variable
        });

        // Set the container interactive over its full potential height
        // Use stored properties
        // Use local variables
        this.inventoryContainer.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, inventoryAreaWidth, maxContentHeight),
            Phaser.Geom.Rectangle.Contains
        );

        // Add pointerdown listener to the container
        this.inventoryContainer.on('pointerdown', (pointer, localX, localY, event) => {
            console.log(`[Debug] inventoryContainer pointerdown: localX=${localX.toFixed(1)}, localY=${localY.toFixed(1)}`);

            // REMOVED: Check for popupJustClosedByButton flag (This comment confirms removal from previous attempt)

            // Iterate through children to find which one was clicked
            let clickedChild = null;
            let clickedCharData = null;

            for (const child of this.inventoryContainer.list) {
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
        this.inventoryContainer.setMask(mask);

        // Add drag scrolling
        const scrollBounds = {
            minY: inventoryAreaY - (maxContentHeight > inventoryAreaHeight ? maxContentHeight - inventoryAreaHeight : 0), // Use local variable
            maxY: inventoryAreaY
        };

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            // Check if pointer is over the inventory area roughly
             if (pointer.y >= inventoryAreaY && pointer.y <= inventoryAreaY + inventoryAreaHeight) {
                let newY = this.inventoryContainer.y - deltaY * 0.5; // Adjust scroll speed as needed
                newY = Phaser.Math.Clamp(newY, scrollBounds.minY, scrollBounds.maxY);
                this.inventoryContainer.y = newY;
            }
        });

        // Optional: Add drag input for touch/mouse dragging (more complex)
        // this.inventoryContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, inventoryAreaWidth, maxContentHeight), Phaser.Geom.Rectangle.Contains);
        // this.input.setDraggable(this.inventoryContainer);
        // this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        //     if (gameObject === this.inventoryContainer) {
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
        const startBattleButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 150, 'Start Battle', { fontSize: '64px', fill: '#0f0' })
            .setOrigin(0.5)
            .setInteractive();

        const buttonBounds = startBattleButton.getBounds();
        const buttonOutline = this.add.graphics();
        buttonOutline.lineStyle(2, 0xffffff, 1);
        buttonOutline.strokeRect(buttonBounds.x - 5, buttonBounds.y - 5, buttonBounds.width + 10, buttonBounds.height + 10);

        startBattleButton.on('pointerdown', () => {
            // --- Get Final Player Team Slot Data ---
            // Get the data from each visual slot (can be character data or null)
            const finalTeamSlotData = this.playerTeamDisplays
                .map(displayObject => displayObject ? displayObject.data : null);

            // --- Save Final Team to GameDataManager ---
            GameDataManager.updateTeam(finalTeamSlotData);
            console.log("PreBattleSetupScene: Final team saved to GameDataManager.");

            // --- Get Active Team for Battle ---
            // Filter out empty slots for the actual battle team
            const activePlayerTeamData = finalTeamSlotData.filter(charData => charData !== null);

            if (activePlayerTeamData.length === 0) {
                console.error("Player team is empty. Cannot start battle.");
                // TODO: Show an error message to the player?
                return;
            }

            // --- Convert active team data to BattleCharacter instances ---
            const playerBattleTeam = activePlayerTeamData.map(charData => {
                 if (!charData || !charData.definitionId) { // Should not happen if data is valid
                     console.error("Invalid character data in final team slot:", charData);
                     return null; // Skip invalid character data
                 }
                 // Create a new BattleCharacter for the battle
                 // Ensure level is correctly sourced if available (e.g., charData.level)
                 return new BattleCharacter(charData.definitionId, charData.level || 1, 'player');
             }); // No need to filter nulls here if activePlayerTeamData is already filtered

             if (playerBattleTeam.length !== activePlayerTeamData.length) {
                 console.warn("Some characters could not be converted for battle.");
                 // Decide if battle should proceed with partial team
             }

             if (playerBattleTeam.length === 0) {
                 console.error("Player battle team is empty after conversion. Cannot start battle.");
                 return;
             }


            console.log("Starting Battle with Player Team:", playerBattleTeam.map(c => c.name));
            console.log("Enemy Team:", enemyTeam.map(c => c.name));

            // Start BattleScene - It will get the team from GameDataManager
            this.scene.start('BattleScene', { battleIndex });
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

    // Removed displayCharacterInfo as it's replaced by the new interaction model

    // --- Helper Functions ---

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
    _showActionPopup(characterData, inventoryDisplay, clickX, clickY) {
        console.log(`[Debug] _showActionPopup called for ${characterData.name}.`);

        // REMOVED: Disable background interactivity logic (Ensuring removal)

        // Determine if the character is currently in the team
        const isInTeam = this.playerTeamDisplays.some(displayObj => displayObj && displayObj.data === characterData);
        console.log(`[Debug _showActionPopup] Is ${characterData.name} in team? ${isInTeam}`);

        // Determine button configuration
        const showMove = true; // Always show move option for now
        const buttonsToShow = [];
        if (showMove) {
            buttonsToShow.push({ text: 'Move', color: '#0f0', action: 'move' });
        }
        buttonsToShow.push({ text: 'Inspect', color: '#ff0', action: 'inspect' });

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
        // Link popup to the display object that triggered it (inventory or team slot display)
        this.actionPopup.setData('targetDisplay', inventoryDisplay); // Use consistent key 'targetDisplay'
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

            // Add listener to the background rectangle
            buttonBg.on('pointerdown', (pointer, localX, localY, event) => {
                console.log(`[Debug] ${buttonInfo.text} button clicked.`);
                event.stopPropagation(); // IMPORTANT: Stop click from reaching elements below popup

                // Hide the popup FIRST
                this._hideActionPopup();

                // Perform the action based on buttonInfo
                if (buttonInfo.action === 'move') {
                    if (isInTeam) {
                        console.log(`[Debug] Calling _handleMoveFromTeamClick for ${characterData.name}`);
                        this._handleMoveFromTeamClick(characterData);
                    } else {
                        console.log(`[Debug] Calling _handleMoveToTeamClick for ${characterData.name}`);
                        this._handleMoveToTeamClick(characterData, inventoryDisplay);
                    }
                } else if (buttonInfo.action === 'inspect') {
                    console.log(`[Debug] Calling _handleInspectClick for ${characterData.name}`);
                    this._handleInspectClick(characterData);
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
            // Update inventory visuals (remove checkmark)
            this._updateInventorySelectionVisuals();
        } else {
            console.warn(`Could not find ${characterData.name} in the team display array.`);
        }

        // REMOVED: this._hideActionPopup(); // Now handled by the button listener itself
    }


    _handleInspectClick(characterData) {
        if (!characterData) return;
        console.log('Inspect selected for:', characterData.name);
        // TODO: Implement actual inspect functionality later
        // REMOVED: this._hideActionPopup(); // Now handled by the button listener itself
    }

    _handleTeamMemberClick(icon, pointer) {
        const characterData = icon.getData('characterData');
        if (!characterData) return;

        console.log('Clicked team member:', characterData.name);
        this._hideActionPopup(); // Hide any existing popup first
        // Show popup, likely inspect-only for now
        // Pass 'icon' as the display target for positioning/checking later
        this._showActionPopup(characterData, icon, pointer.worldX, pointer.worldY, true); // true = inspectOnly
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

            // --- Cleanup ---
            this.isMovingState = false;
            this.selectedInventoryCharacterData = null; // Clear selection after move
            this.selectedInventoryDisplay = null;
            this.playerTeamSlots.forEach(slot => slot.setStrokeStyle(2, 0xffffff)); // Reset slot highlight
            this._hideActionPopup(); // Ensure popup is hidden
            this._updateInventorySelectionVisuals(); // Update all checkmarks

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
                // Pass the character data, the display object *in the slot*, and slot position.
                this._showActionPopup(characterDataInSlot, characterDisplayInSlot, worldX, worldY);
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
        // Iterate through inventory displays and team displays
        // Add/remove checkmarks based on whether the character is in the playerTeamDisplays array
        console.log("Updating inventory selection visuals...");
        const teamCharacterSet = new Set(
            this.playerTeamDisplays
                .filter(display => display !== null)
                .map(displayObj => displayObj.data) // Get data from {icon, text, data} object
        );

        this.inventoryDisplays.forEach(invDisplay => {
            const charData = invDisplay.getData('characterData');
            const isInTeam = teamCharacterSet.has(charData);
            // TODO: Add actual checkmark visual to MenuCharacterDisplay class
            // For now, just log
            if (isInTeam) {
                console.log(`  - ${charData.name} is in team (should have checkmark)`);
                // invDisplay.showCheckmark(true); // Example method
            } else {
                 console.log(`  - ${charData.name} is not in team (no checkmark)`);
                // invDisplay.showCheckmark(false); // Example method
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
            icon.setDisplaySize(90, 90);
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


    update() {
        // Update logic if needed (e.g., for scrolling)
    }
}

export default PreBattleSetupScene;