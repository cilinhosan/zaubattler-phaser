import Phaser from "phaser";
// import Character from "./game/Character"; // Removed unused import
import battlesData from './game/battles.json'; // Import battle data
import CharacterDisplay from './game/CharacterDisplay'; // Import CharacterDisplay class
// import { ActiveSkill } from "./game/Skill"; // Removed unused import

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
        // Preload assets if needed
        // Load skill icons here based on SkillDefinitions
    }

    create(data) {
        // Set background color
        this.cameras.main.setBackgroundColor('#1a1a1a'); // Dark grey color

        // Receive team data and battle index from PreBattleSetupScene
        this.playerTeam = data.playerTeam;
        this.enemyTeam = data.enemyTeam;
        this.battleIndex = data.battleIndex;

        // Create a combined array of all characters for this battle instance
        this.allBattleCharacters = [...this.playerTeam, ...this.enemyTeam];

        // Initialize the 'characters' array with only active characters for turn order
        this.characters = this.allBattleCharacters.filter(char => !char.isDefeated);


        // Create CharacterDisplay instances for all characters initially in the battle
        this.characterDisplays = this.allBattleCharacters.map((char, index) => {
            const teamIndex = char.team === 'player' ? this.playerTeam.indexOf(char) : this.enemyTeam.indexOf(char);
            const display = new CharacterDisplay(this, char, char.team, teamIndex);
            char.display = display;
            if (char.isDefeated) {
                 display.hide();
            }
            return display;
        });

        // Battle state variables
        this.isBattleOver = false;
        this.turnCounter = 0;
        this.activeCharacterIndex = 0; // Start with the first character in the active 'characters' array
        this.currentActiveCharacter = null;

        // Display turn counter
        this.turnText = this.add.text(this.cameras.main.width / 2, 80, `Turn: ${this.turnCounter}`, { fontSize: '100px', fill: '#fff' }).setOrigin(0.5);

        // Start the battle
        this.time.delayedCall(1000, this.startTurn, [], this);
    }

    startTurn() {
        if (this.isBattleOver) return;

        // Check for battle end conditions first
        const allPlayerDefeated = this.playerTeam.every(char => char.isDefeated);
        const allEnemyDefeated = this.enemyTeam.every(char => char.isDefeated);
        if (allPlayerDefeated || allEnemyDefeated) {
            this.endBattle();
            return;
        }

        // Ensure the active characters list is up-to-date (should be correct from previous endTurn)
        if (this.characters.length === 0) {
            console.error("No active characters left at start of turn, ending battle.");
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
            const highlightColor = chosenAction.name === "Basic Attack" ? 0xffa500 : 0x0000ff; // Orange for basic, Blue for skill
            this.currentActiveCharacter.display.highlightBorder(highlightColor);
        } else if (!chosenAction) {
             console.log(`${this.currentActiveCharacter.name} could not determine an action.`);
             // If no action, maybe clear highlight or leave green? Let's leave green for now.
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
                 const currentTargetTeam = this.currentActiveCharacter.team === 'player'
                     ? this.enemyTeam.filter(char => !char.isDefeated)
                     : this.playerTeam.filter(char => !char.isDefeated);
                 const currentCasterTeam = this.currentActiveCharacter.team === 'player'
                     ? this.playerTeam.filter(char => !char.isDefeated)
                     : this.enemyTeam.filter(char => !char.isDefeated); // Recalculate caster team too just in case

                 if (currentTargetTeam.length > 0) {
                      console.log(`Executing action: ${chosenAction.name} for ${this.currentActiveCharacter.name}`);

                      // Highlight change is now done *before* the delay

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

                    // Pass the original playerTeam (with reset stats) and the next index
                    this.scene.start('PreBattleSetupScene', { playerTeam: this.playerTeam, battleIndex: nextBattleIndex });
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