import Phaser from "phaser";
import Character from "./game/Character";
import battlesData from './game/battles.json'; // Import battle data
import CharacterDisplay from './game/CharacterDisplay'; // Import CharacterDisplay class

const MAX_SLOTS = 5; // Define max slots per team

class BattleScene extends Phaser.Scene {
    constructor() {
        super({key: "BattleScene"});
    }

    preload() {
        // Preload assets if needed
    }

    create(data) {
        // Set background color
        this.cameras.main.setBackgroundColor('#1a1a1a'); // Dark grey color

        // Receive team data and battle index from PreBattleSetupScene
        this.playerTeam = data.playerTeam;
        this.enemyTeam = data.enemyTeam;
        this.battleIndex = data.battleIndex; // Store the current battle index

        // Create CharacterDisplay instances for player team
        this.playerDisplays = this.playerTeam.map((char, index) => {
            // Ensure maxHp is set before creating display
            char.maxHp = char.maxHp || char.hp;
            const display = new CharacterDisplay(this, char, 'player', index);
            // Store display reference on character for easy lookup (optional, but can be helpful)
            char.display = display;
            return display;
        });

        // Create CharacterDisplay instances for enemy team
        this.enemyDisplays = this.enemyTeam.map((char, index) => {
            // Ensure maxHp is set before creating display
            char.maxHp = char.maxHp || char.hp;
            const display = new CharacterDisplay(this, char, 'enemy', index);
            // Store display reference on character
            char.display = display;
            return display;
        });

        // Battle state variables
        this.currentTurn = 'player'; // 'player' or 'enemy'
        this.isBattleOver = false;
        this.turnCounter = 0;

        // Display turn counter
        // Adjusted font size and removed scaling
        this.turnText = this.add.text(this.cameras.main.width / 2, 80, `Turn: ${this.turnCounter}`, { fontSize: '100px', fill: '#fff' }).setOrigin(0.5); // Increased font size and moved down slightly

        // Start the battle
        this.time.delayedCall(1000, this.startTurn, [], this); // Delay start for readability
    }

    startTurn() {
        if (this.isBattleOver) return;

        // Check for battle end conditions before starting the turn
        if (this.playerTeam.length === 0 || this.enemyTeam.length === 0) {
            this.endBattle();
            return;
        }

        if (this.currentTurn === 'player') {
            this.playerAttack();
        } else {
            this.enemyAttack();
        }
    }

    playerAttack() {
        // Select a random active player character
        const attackerIndex = Math.floor(Math.random() * this.playerTeam.length);
        const attacker = this.playerTeam[attackerIndex];
        const attackerDisplay = this.playerDisplays[attackerIndex]; // Get corresponding display

        // Select a random active enemy character
        const targetIndex = Math.floor(Math.random() * this.enemyTeam.length);
        const target = this.enemyTeam[targetIndex];
        const targetDisplay = this.enemyDisplays[targetIndex]; // Get corresponding display

        // Check if attacker and target displays are valid
        if (!attackerDisplay || !targetDisplay) {
             console.warn("Attacker or target display not found, skipping turn.");
             this.endTurn('enemy'); // Skip to next turn
             return;
        }

        // Visual feedback for attack
        const yellowHighlight = this.add.graphics();
        yellowHighlight.lineStyle(4, 0xffff00, 1);
        // Use display properties for position and size
        yellowHighlight.strokeRect(attackerDisplay.graphics.x, attackerDisplay.graphics.y, attackerDisplay.rectWidth, attackerDisplay.rectHeight);
        const attackIndicator = this.drawAttackIndicator(attackerDisplay, targetDisplay); // Pass displays

        // Shake target using its display method
        targetDisplay.shake();

        // Calculate damage (simple attack - defense)
        const damage = Math.max(0, attacker.atk - target.def);
        target.hp -= damage;
        target.hp = Math.max(0, target.hp); // Ensure HP doesn't go below 0

        console.log(`Player ${attacker.name} attacks Enemy ${target.name || target.type} for ${damage} damage. Enemy HP: ${target.hp}`);

        // Update HP bar and text for the target using its display method
        targetDisplay.updateHpDisplay();

        // Remove defeated enemy
        if (target.hp <= 0) {
            console.log(`Enemy ${target.name || target.type} defeated!`);
            targetDisplay.destroy(); // Destroy display elements
            // Remove from arrays
            this.enemyTeam.splice(targetIndex, 1);
            this.enemyDisplays.splice(targetIndex, 1);

            // Re-index remaining displays if necessary (or handle lookup differently)
            // For simplicity, we might skip re-indexing if lookup uses character reference
        }

        // Revert visual changes and switch turn after a delay
        this.time.delayedCall(800, () => {
            attackIndicator.destroy();
            yellowHighlight.destroy();
            // Border color reset is handled by shake() in CharacterDisplay
            this.endTurn('enemy'); // Use helper to switch turn
        }, [], this);
    }

    enemyAttack() {
        // Select a random active enemy character
        const attackerIndex = Math.floor(Math.random() * this.enemyTeam.length);
        const attacker = this.enemyTeam[attackerIndex];
        const attackerDisplay = this.enemyDisplays[attackerIndex]; // Get corresponding display

        // Select a random active player character
        const targetIndex = Math.floor(Math.random() * this.playerTeam.length);
        const target = this.playerTeam[targetIndex];
        const targetDisplay = this.playerDisplays[targetIndex]; // Get corresponding display

        // Check if attacker and target displays are valid
        if (!attackerDisplay || !targetDisplay) {
             console.warn("Attacker or target display not found, skipping turn.");
             this.endTurn('player'); // Skip to next turn
             return;
        }

        // Visual feedback for attack
        const yellowHighlight = this.add.graphics();
        yellowHighlight.lineStyle(4, 0xffff00, 1);
        // Use display properties for position and size
        yellowHighlight.strokeRect(attackerDisplay.graphics.x, attackerDisplay.graphics.y, attackerDisplay.rectWidth, attackerDisplay.rectHeight);
        const attackIndicator = this.drawAttackIndicator(attackerDisplay, targetDisplay); // Pass displays

        // Shake target using its display method
        targetDisplay.shake();

        // Calculate damage
        const damage = Math.max(0, attacker.atk - target.def);
        target.hp -= damage;
        target.hp = Math.max(0, target.hp); // Ensure HP doesn't go below 0

        console.log(`Enemy ${attacker.name || attacker.type} attacks Player ${target.name} for ${damage} damage. Player HP: ${target.hp}`);

        // Update HP bar and text for the target using its display method
        targetDisplay.updateHpDisplay();

        // Remove defeated player
        if (target.hp <= 0) {
            console.log(`Player ${target.name} defeated!`);
            targetDisplay.destroy(); // Destroy display elements
            // Remove from arrays
            this.playerTeam.splice(targetIndex, 1);
            this.playerDisplays.splice(targetIndex, 1);

             // Re-index remaining displays if necessary
        }

        // Revert visual changes and switch turn after a delay
        this.time.delayedCall(800, () => {
            attackIndicator.destroy();
            yellowHighlight.destroy();
            // Border color reset is handled by shake() in CharacterDisplay
            this.endTurn('player'); // Use helper to switch turn
        }, [], this);
    }

    // Helper function to switch turns and start the next one
    endTurn(nextTurn) {
        this.currentTurn = nextTurn;
        if (nextTurn === 'player') { // Only increment turn counter when it becomes player's turn
             this.turnCounter++;
             this.turnText.setText(`Turn: ${this.turnCounter}`);
        }
        // Check for end conditions *before* starting the next turn delay
        if (this.playerTeam.length === 0 || this.enemyTeam.length === 0) {
            this.endBattle();
        } else {
            this.time.delayedCall(800, this.startTurn, [], this); // Start next turn
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

    // highlightBorder is now part of CharacterDisplay
    // shakeElement is now shake() in CharacterDisplay
    // updateHpDisplay is now updateHpDisplay() in CharacterDisplay

    endBattle() {
        if (this.isBattleOver) return; // Prevent multiple calls
        this.isBattleOver = true;
        console.log("Battle Over!");

        let outcome = 'lose'; // Default to lose
        if (this.enemyTeam.length === 0) {
            outcome = 'win';
        }

        // --- Battle Progression Logic ---
        if (outcome === 'win') {
            const nextBattleIndex = this.battleIndex + 1;
            if (nextBattleIndex < battlesData.length) {
                // Proceed to the next battle
                console.log(`Proceeding to Battle ${nextBattleIndex + 1}`);
                this.time.delayedCall(1500, () => {
                    // --- Reset Player HP before next battle ---
                    console.log("Resetting player team HP...");
                    this.playerTeam.forEach(char => {
                        if (char.maxHp) {
                            char.hp = char.maxHp; // Reset HP to max
                        } else {
                            // Fallback or warning if maxHp isn't set
                            console.warn(`Character ${char.name} missing maxHp. Cannot reset HP properly.`);
                            // You might need a more robust way to get original HP if maxHp isn't reliable
                        }
                    });
                    // --- End Reset Player HP ---

                    // Pass the player team (now with reset HP) and the next index
                    this.scene.start('PreBattleSetupScene', { playerTeam: this.playerTeam, battleIndex: nextBattleIndex });
                }, [], this);
            } else {
                // All battles completed
                console.log("All battles won!");
                this.time.delayedCall(1500, () => {
                    this.scene.start('EndGameScene', { outcome: 'win' }); // Go to End Game Scene (Win)
                }, [], this);
            }
        } else {
            // Player lost
            console.log("Player lost the battle.");
            this.time.delayedCall(1500, () => {
                this.scene.start('EndGameScene', { outcome: 'lose' }); // Go to End Game Scene (Lose)
            }, [], this);
        }
        // --- End Battle Progression Logic ---
    }

    update() {
        // Check for battle end conditions continuously in update might be redundant
        // if startTurn already handles it, but can be a failsafe.
        // if (!this.isBattleOver && (this.playerTeam.length === 0 || this.enemyTeam.length === 0)) {
        //     this.endBattle();
        // }
    }
}


export default BattleScene;