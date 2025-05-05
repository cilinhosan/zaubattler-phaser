import Phaser from "phaser";
import battlesData from './game/battles.json'; // Import battle data
import CharacterBattleDisplay from './game/CharacterBattleDisplay'; // Import CharacterBattleDisplay class
import GameDataManager from './game/GameDataManager.js'; // Import the GameDataManager singleton
import BattleCharacter from './game/BattleCharacter.js'; // Needed to create instances
import { getCharacterDefinition } from './CharacterDefinitionList.js'; // Needed for enemy creation
import AssetLoader from './AssetLoader.js'; // Import the AssetLoader class

const MAX_SLOTS = 5; // Define max slots per team

class BattleScene extends Phaser.Scene {
    constructor() {
        super({key: "BattleScene"});
        this.characters = []; // Unified array of characters currently active in battle
        this.allBattleCharacters = []; // Array of all characters initially in battle (including defeated)
        this.activeCharacterIndex = 0; // Index of the character whose turn it is in the 'characters' array
        this.currentActiveCharacter = null; // Store the character whose turn it currently is
    }

    preload() {
        console.log("BattleScene: Preloading assets for current battle...");
        const manifest = this.registry.get('assetManifest');

        if (!manifest) {
            console.error('BattleScene: Asset Manifest not found in registry!');
            // Optionally display an error message on screen
            this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2,
                'Error: Asset Manifest missing!',
                { fill: '#ff0000', fontSize: '24px' }
            ).setOrigin(0.5);
            return; // Stop preloading if manifest is missing
        }
        console.log('BattleScene: Found Asset Manifest:', manifest);

        // --- Instantiate AssetLoader ---
        const assetLoader = new AssetLoader(this);
        if (!assetLoader.manifest) {
            console.error("BattleScene: AssetLoader could not initialize (manifest missing). Stopping preload.");
            // Optionally display an error message on screen
            return;
        }

        // --- Determine Assets for Player and Enemy Teams ---
        const playerTeam = GameDataManager.getCurrentBattlePlayerTeam();
        const enemyTeam = GameDataManager.getCurrentBattleEnemyTeam();

        // Create a Set of unique definition IDs from both teams
        const uniqueDefinitionIds = new Set();
        playerTeam.forEach(char => char?.definitionId && uniqueDefinitionIds.add(char.definitionId));
        enemyTeam.forEach(char => char?.definitionId && uniqueDefinitionIds.add(char.definitionId));

        console.log(`BattleScene Preload: Loading battle icons for ${uniqueDefinitionIds.size} unique character definitions.`);

        // --- Preload Battle Icons using Robust AssetLoader ---
        uniqueDefinitionIds.forEach(definitionId => {
            const definition = getCharacterDefinition(definitionId);
            if (!definition) {
                console.warn(`BattleScene: Could not find definition for ID '${definitionId}' while preloading assets.`);
                return; // Skip if definition not found
            }

            // --- Load Battle Icon using Robust AssetLoader ---
            if (definition.battleIconPath && definition.battleIconKey) {
                 // Pass the Phaser key and original path from the definition
                assetLoader.preloadAsset(definition.battleIconKey, definition.battleIconPath, 'image');
            } else {
                console.warn(`BattleScene: Definition '${definitionId}' missing battleIconPath or battleIconKey.`);
            }
            // Note: Face icons are not needed in BattleScene, so we don't load them here.
        });

        // --- Load Default Battle Icon (if needed as fallback, using Robust AssetLoader) ---
        // Example: If you needed a guaranteed fallback even if manifest lookup fails for specific characters
        // assetLoader.preloadAsset('default_battle_icon', 'assets/default_character_ilustration_4_3.png');

        console.log("BattleScene: Preload finished queuing assets via Robust AssetLoader.");
        // Load other assets like skill effect spritesheets or audio here if needed, using assetLoader.preloadAsset(...)
    }

    create() { // Removed 'data' parameter
        // Set background color
        this.cameras.main.setBackgroundColor('#1a1a1a'); // Dark grey color

        // --- Get Prepared Teams and Battle Index from GameDataManager ---
        this.playerTeam = GameDataManager.getCurrentBattlePlayerTeam();
        this.enemyTeam = GameDataManager.getCurrentBattleEnemyTeam();
        this.battleIndex = GameDataManager.getCurrentBattleIndex(); // Get index for reference if needed

        if (!this.playerTeam || this.playerTeam.length === 0) {
            console.error("BattleScene Error: Player team not found or empty in GameDataManager!");
            // Handle error - maybe go back to menu?
            this.scene.start('MenuScreenScene');
            return;
        }
        if (!this.enemyTeam || this.enemyTeam.length === 0) {
            console.error("BattleScene Error: Enemy team not found or empty in GameDataManager!");
            // Handle error - maybe go back to menu?
            this.scene.start('MenuScreenScene');
            return;
        }

        console.log("BattleScene: Loaded Player Team from GameDataManager:", this.playerTeam.map(c => c.name));
        console.log("BattleScene: Loaded Enemy Team from GameDataManager:", this.enemyTeam.map(c => c.name));
        console.log("BattleScene: Current Battle Index:", this.battleIndex);


        // Create a combined array of all characters for this battle instance
        this.allBattleCharacters = [...this.playerTeam, ...this.enemyTeam];


        // dev_comment: Is this even necessary? create function shouldn't really accept defeated characters to begin with
        // Initialize the 'characters' array with only active characters for turn order
        this.characters = this.allBattleCharacters.filter(char => !char.isDefeated);

        // Create CharacterDisplay instances for all characters initially in the battle
        this.characterDisplays = []; // Initialize an empty array
        for (const char of this.allBattleCharacters) {
            // Determine the index within the specific team array
            const teamIndex = char.team === 'player' ? this.playerTeam.indexOf(char) : this.enemyTeam.indexOf(char);
            // Get the size of the team this character belongs to
            const teamSize = char.team === 'player' ? this.playerTeam.length : this.enemyTeam.length;
            // Pass teamSize as the 5th argument
            const display = new CharacterBattleDisplay(this, char, char.team, teamIndex, teamSize);
            char.display = display; // Assign the display back to the character
            if (char.isDefeated) {
                 display.hide(); // Hide if defeated
            }
            this.characterDisplays.push(display); // Add the created display to the array
        }

        // Battle state variables
        this.isBattleOver = false;
        this.turnCounter = 1; //dev_comment: changed to start at turn 1
        this.activeCharacterIndex = 0; // Start with the first character in the active 'characters' array
        this.currentActiveCharacter = null;

        // Display turn counter
        this.turnText = this.add.text(this.cameras.main.width / 2, 80, `Turn: ${this.turnCounter}`, { fontSize: '100px', fill: '#fff' }).setOrigin(0.5);

        // --- Handle Background Loaded Audio (Structure only) ---
        this.setupBackgroundMusic(); // Call the setup function

        // Start the battle
        this.time.delayedCall(1000, this.startTurn, [], this);
    }

    /**
     * Checks if background music is loaded and plays it,
     * or sets up a listener to play it when loaded.
     * NOTE: Currently commented out as assets are not yet available/imported/loaded.
     */
    setupBackgroundMusic() {
        const musicKey = 'battle_music_loop';
        console.log(`BattleScene: Checking for background music ('${musicKey}')...`);

        /* --- SECTION TO UNCOMMENT WHEN BACKGROUND LOADING IS ENABLED ---
        // Check if the sound is already decoded and ready in the cache
        if (this.cache.audio.has(musicKey)) {
            console.log(` - Background music '${musicKey}' already loaded.`);
            // Play it if not already playing (e.g., if returning to scene)
            // if (!this.isBattleOver && this.sound.get(musicKey) === null) {
            //     this.sound.play(musicKey, { loop: true, volume: 0.5 });
            //     console.log("Battle music started (already cached).");
            // }
        } else {
            // If not loaded, listen for the specific file completion event from the loader
            console.log(` - Background music '${musicKey}' not loaded yet. Setting up listener.`);
            // this.load.once(`filecomplete-audio-${musicKey}`, (key, type, data) => {
            //     console.log(`   - Background music '${key}' finished loading.`);
            //     // Play it now that it's loaded (if battle isn't over)
            //     if (!this.isBattleOver && this.sound.get(key) === null) {
            //         this.sound.play(key, { loop: true, volume: 0.5 });
            //         console.log("Battle music started (after loading).");
            //     }
            // });

            // Optional: Check if the loader is even active. If PreloaderScene didn't find the asset,
            // the 'filecomplete' event might never fire.
            // if (!this.load.isLoading()) {
            //    console.warn(` - Loader is not active. '${musicKey}' might not have been queued for background loading.`);
            // }
        }
        --- END SECTION TO UNCOMMENT --- */

        // Similarly, you could check/listen for SFX like 'basic_attack' here if needed,
        // though SFX are often just checked before playing via this.sound.play('basic_attack')
        // without needing complex listeners unless you need confirmation they are cached.
    }

    startTurn() {
        if (this.isBattleOver) return;

        // Check for battle end conditions first
        const allPlayerCharactersDefeated = this.playerTeam.every(char => char.isDefeated);
        const allEnemyDefeated = this.enemyTeam.every(char => char.isDefeated);
        if (allPlayerCharactersDefeated || allEnemyDefeated) {
            this.endBattle();
            return;
        }

       
        // Ensure the active characters list is up-to-date (should be correct from previous endTurn)
        if (this.characters.length <= 1) { //dev_comment: changed from === 0 to <= 1 
            console.error("Only one character left or less at start of turn, ending battle.");
            this.endBattle();
            return;
        }

        // Validate and adjust activeCharacterIndex (should point to the correct next character)
        this.activeCharacterIndex = this.activeCharacterIndex % this.characters.length;

        // Get the character for the current turn
        this.currentActiveCharacter = this.characters[this.activeCharacterIndex];

        // Safeguard against unexpected state
        if (!this.currentActiveCharacter || this.currentActiveCharacter.isDefeated) {
            console.error(`Error: Attempting to start turn for invalid character at index ${this.activeCharacterIndex}. Trying to recover.`);
            // Force recalculation and try to advance
            this.updateActiveCharactersAndVisuals(); // Update the list
            this.advanceTurn(); // Try to move to the next turn
            return;
        }


        console.log(`--- Turn ${this.turnCounter + 1}: ${this.currentActiveCharacter.name}'s turn (${this.currentActiveCharacter.team}) ---`);

        // 1. Highlight green at start of turn
        if (this.currentActiveCharacter.display) {
            this.currentActiveCharacter.display.highlightBorder(0x00ff00); // Green highlight for active
        }

        // Call onTurnStart for the active character (handles cooldowns and status effects)
        this.currentActiveCharacter.onTurnStart();

        // Determine potential target and caster teams
        const targetTeam = this.currentActiveCharacter.team === 'player'
            ? this.enemyTeam.filter(char => !char.isDefeated)
            : this.playerTeam.filter(char => !char.isDefeated);
        const casterTeam = this.currentActiveCharacter.team === 'player'
            ? this.playerTeam.filter(char => !char.isDefeated)
            : this.enemyTeam.filter(char => !char.isDefeated);

        // 2. Determine the action the character will take
        const chosenAction = this.currentActiveCharacter.determineAction(targetTeam, casterTeam); // Pass both teams

        // 3. Change highlight based on determined action (BEFORE delay)
        if (chosenAction && this.currentActiveCharacter.display) {
            if (chosenAction.name === "Pass") {
                // Clear highlight if the action is Pass
                this.currentActiveCharacter.display.highlightBorder(null); // Assuming null clears the border
                 console.log(`${this.currentActiveCharacter.name} is passing the turn.`);
            } else {
                // Set highlight for Basic Attack or Skills
                const highlightColor = chosenAction.name === "Basic Attack" ? 0xffa500 : 0x0000ff; // Orange for basic, Blue for skill
                this.currentActiveCharacter.display.highlightBorder(highlightColor);
            }
        }

        // 4. Execute the chosen action after a delay
        this.time.delayedCall(800, () => {
            // Ensure the character hasn't been defeated between startTurn and action execution
            if (!this.currentActiveCharacter || this.currentActiveCharacter.isDefeated) {
                console.log(`${this.currentActiveCharacter?.name || 'Character'} was defeated before acting or is invalid.`);
                // Update state and visuals, then advance
                this.updateActiveCharactersAndVisuals();
                this.advanceTurn();
                return;
            }

            // Execute the determined action
            if (chosenAction && typeof chosenAction.execute === 'function') {
                 // Re-check if targets still exist (could be defeated by effects between turns)
                 // Imperative filtering for living characters
                 const livingPlayerTeam = [];
                 for (const char of this.playerTeam) {
                     if (char && !char.isDefeated) {
                         livingPlayerTeam.push(char);
                     }
                 }
                 const livingEnemyTeam = [];
                 for (const char of this.enemyTeam) {
                     if (char && !char.isDefeated) {
                         livingEnemyTeam.push(char);
                     }
                 }

                 const currentTargetTeam = this.currentActiveCharacter.team === 'player'
                     ? livingEnemyTeam
                     : livingPlayerTeam;
                 const currentCasterTeam = this.currentActiveCharacter.team === 'player'
                     ? livingPlayerTeam
                     : livingEnemyTeam; // Recalculate caster team too just in case

                 // Check if there are valid targets based on the action's target type
                 let validTargetsExist = false;
                 if (chosenAction.targetType === 'enemy' || chosenAction.targetType === 'allEnemies') {
                     validTargetsExist = currentTargetTeam.length > 0;
                 } else if (chosenAction.targetType === 'ally' || chosenAction.targetType === 'allAllies' || chosenAction.targetType === 'self') {
                     validTargetsExist = currentCasterTeam.length > 0;
                 } else if (chosenAction.targetType === 'none' || chosenAction.name === "Pass") {
                     validTargetsExist = true; // Actions like "Pass" don't need targets
                 } else {
                     // Default assumption: if target type is unclear, assume it needs a target team
                     validTargetsExist = currentTargetTeam.length > 0 || currentCasterTeam.length > 0;
                 }


                 if (validTargetsExist) {
                      console.log(`Executing action: ${chosenAction.name} for ${this.currentActiveCharacter.name}`);

                      // Pass potentially updated teams to the action's execute method
                      // Note: The skill's internal effectFn might use the teams passed during getAction,
                      // or it might need the most current teams passed here. Adjust Skill.js if needed.
                      chosenAction.execute(currentTargetTeam, currentCasterTeam);
                 } else {
                      console.log(`${this.currentActiveCharacter.name} determined action ${chosenAction.name}, but no valid targets remain.`);
                 }
            } else {
                 console.error(`${this.currentActiveCharacter.name} failed to determine a valid action.`);
                 // Consider if a default action (like basic attack) should happen here as a fallback
            }


            // Update the active character list and handle visuals immediately after action
            this.updateActiveCharactersAndVisuals();

            // Call onTurnEnd for the character
            this.currentActiveCharacter.onTurnEnd();

            // Advance to the next turn
            this.advanceTurn();

        }, [], this);
    }

    // Updates the active character list and handles visuals for defeated characters
    updateActiveCharactersAndVisuals() {
        // Store the currently active character before filtering
        const previousActiveCharacter = this.currentActiveCharacter;
        const previousLength = this.characters.length;

        // Update the main 'characters' array to only include non-defeated characters
        this.characters = this.allBattleCharacters.filter(char => !char.isDefeated);

        // Destroy displays of newly defeated characters
        this.allBattleCharacters.forEach(char => {
            if (char.isDefeated && char.display && !char.display.isDestroyed) {
                char.display.destroy();
            }
        });

        // If the list length changed, we need to find the correct index for the *next* turn
        if (this.characters.length < previousLength && previousActiveCharacter) {
            // Find the index of the character *after* the one who just acted in the new list
            const lastActorIndexInNewList = this.characters.indexOf(previousActiveCharacter);

            if (lastActorIndexInNewList !== -1) {
                // If the actor is still in the list (wasn't defeated by their own action),
                // the next index is the one after them.
                this.activeCharacterIndex = (lastActorIndexInNewList + 1) % this.characters.length;
            } else {
                // If the actor *was* defeated, the index might already be pointing correctly
                // due to the filtering, but we need to ensure it's valid.
                this.activeCharacterIndex = this.activeCharacterIndex % this.characters.length;
            }
        } else if (this.characters.length > 0) {
             // If length didn't change, simply prepare the index for the next turn
             this.activeCharacterIndex = (this.activeCharacterIndex + 1) % this.characters.length;
        } else {
             // If no characters are left active
             this.activeCharacterIndex = 0;
        }

         // Ensure index is valid if list became empty
         if (this.characters.length === 0) {
             this.activeCharacterIndex = 0;
         }
    }

    // Handles the logic after a character's action is complete and state is updated
    advanceTurn() {
        // Remove highlight from the character who just finished their turn
        if (this.currentActiveCharacter && this.currentActiveCharacter.display && !this.currentActiveCharacter.display.isDestroyed) {
             this.currentActiveCharacter.display.clearHighlight();
        }

        // Check for end conditions *after* updating the active list
        const allPlayerDefeated = this.playerTeam.every(char => char.isDefeated);
        const allEnemyDefeated = this.enemyTeam.every(char => char.isDefeated);

        if (allPlayerDefeated || allEnemyDefeated) {
            this.endBattle();
        } else {
             // Increment turn counter when index wraps back to 0 (start of a new round)
             if (this.activeCharacterIndex === 0) {
                 this.turnCounter++;
                 this.turnText.setText(`Turn: ${this.turnCounter}`);
             }

            // Start the next turn after a delay
            // The activeCharacterIndex is now correctly pointing to the next character
            this.time.delayedCall(800, this.startTurn, [], this);
        }
    }

    // Updated to use CharacterDisplay instances
    drawAttackIndicator(attackerDisplay, targetDisplay) {
        const line = this.add.graphics();
        line.lineStyle(2, 0xffff00, 1); // Yellow line

        // Use display's graphics object position and dimensions
        const attackerCenterX = attackerDisplay.graphics.x + attackerDisplay.rectWidth / 2;
        const attackerCenterY = attackerDisplay.graphics.y + attackerDisplay.rectHeight / 2;
        const targetCenterX = targetDisplay.graphics.x + targetDisplay.rectWidth / 2;
        const targetCenterY = targetDisplay.graphics.y + targetDisplay.rectHeight / 2;

        line.lineBetween(attackerCenterX, attackerCenterY, targetCenterX, targetCenterY);
        return line;
    }

    endBattle() {
        if (this.isBattleOver) return; // Prevent multiple calls
        this.isBattleOver = true;
        console.log("Battle Over!");

        const allPlayerDefeated = this.playerTeam.every(char => char.isDefeated);
        let outcome = allPlayerDefeated ? 'lose' : 'win'; // Determine outcome based on who is defeated

        // --- Set Battle Result in GameDataManager ---
        console.log(`BattleScene: Setting last battle result: { won: ${outcome === 'win'} }`);
        GameDataManager.setLastBattleResult({ won: outcome === 'win' }); // Store the result

        // --- Battle Progression Logic ---
        if (outcome === 'win') {
            const nextBattleIndex = this.battleIndex + 1;
            if (nextBattleIndex < battlesData.length) {
                // Proceed to the next battle
                console.log(`Proceeding to Battle ${nextBattleIndex + 1}`);
                this.time.delayedCall(1500, () => {
                    // --- Reset Player HP and Combat Stats before next battle ---
                    console.log("Resetting player team combat stats...");
                    this.playerTeam.forEach(char => {
                        if (char && typeof char.resetForBattle === 'function') {
                            char.resetForBattle(); // Use the new method name
                        } else {
                            console.warn("Attempted to reset invalid character in player team:", char);
                        }
                        // Display objects are destroyed, they need to be recreated in the next scene
                    });
                    // --- End Reset Player HP ---

                    // Increment the global battle index
                    GameDataManager.incrementBattleIndex();

                    // Switch back to the PreBattleSetupScene. Its 'wake' method will handle updates.
                    console.log("Switching back to PreBattleSetupScene...");
                    this.scene.switch('PreBattleSetupScene');
                }, [], this);
            } else {
                // All battles completed
                console.log("All battles won!");
                this.time.delayedCall(1500, () => {
                     this.playerTeam.forEach(char => {
                         if (char && typeof char.resetForBattle === 'function') {
                             char.resetForBattle(); // Use the new method name
                         }
                     });
                    this.scene.start('EndGameScene', { outcome: 'win' }); // Go to End Game Scene (Win)
                }, [], this);
            }
        } else {
            // Player lost
            console.log("Player lost the battle.");
            this.time.delayedCall(1500, () => {
                // Reset player team stats even on loss before going to end game scene
                 this.playerTeam.forEach(char => {
                     if (char && typeof char.resetForBattle === 'function') {
                         char.resetForBattle(); // Use the new method name
                     }
                 });
                this.scene.start('EndGameScene', { outcome: 'lose' }); // Go to End Game Scene (Lose)
            }, [], this);
        }
        // --- End Battle Progression Logic ---
    }

    update() {
        // Update logic if needed
    }
}


export default BattleScene;