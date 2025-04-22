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

        // Define character box dimensions and positions
        // Define character box dimensions and positions for 1080p
        const playerStartX = 300; // Adjusted position
        const playerStartY = 400; // Adjusted position
        const boxWidth = 150; // Increased size
        const boxHeight = 180; // Increased size
        const padding = 40; // Increased padding
        const enemyStartX = 1400; // Adjusted position for right side
        const enemyStartY = 400; // Adjusted position

        // Draw player characters as boxes and add HP bars
        this.playerTeam.forEach((char, index) => {
            char.graphics = this.add.graphics();
            const rectX = playerStartX;
            const rectY = playerStartY + (boxHeight + padding) * index;
            const rectW = boxWidth;
            const rectH = boxHeight;

            char.graphics.setPosition(rectX, rectY);
            char.graphics.lineStyle(2, 0xffffff, 1);
            char.graphics.strokeRect(0, 0, rectW, rectH);
            // Adjusted font size and removed scaling
            char.text = this.add.text(rectX + rectW / 2, rectY + rectH / 2, char.name, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

            char.rectX = rectX;
            char.rectY = rectY;
            char.rectWidth = rectW;
            char.rectHeight = rectH;

            // Add HP bar below the character box
            const hpBarWidth = rectW;
            const hpBarHeight = 10; // Standard HP bar height
            const hpBarY = rectY + rectH; // 25 pixels below the box (shifted down by another 10)

            char.hpBar = this.add.graphics();
            char.hpBar.fillStyle(0x00ff00, 1); // Green color for HP
            char.hpBar.fillRect(rectX, hpBarY, hpBarWidth, hpBarHeight);

            // Ensure maxHp is set, default to current hp if not already set
            char.maxHp = char.maxHp || char.hp;

            // Adjusted font size and stroke thickness
            char.hpText = this.add.text(rectX + hpBarWidth / 2, hpBarY + hpBarHeight / 2, `${char.hp}/${char.maxHp}`, { fontSize: '24px', fill: '#fff' }) // Increased font size
                .setOrigin(0.5)
                .setStroke('#000000', 4); // Increased stroke thickness
        });

        // Draw enemy characters as boxes and add HP bars
        this.enemyTeam.forEach((char, index) => {
            char.graphics = this.add.graphics();
            const rectX = enemyStartX;
            const rectY = enemyStartY + (boxHeight + padding) * index;
            const rectW = boxWidth;
            const rectH = boxHeight;

            char.graphics.setPosition(rectX, rectY);
            char.graphics.lineStyle(2, 0xffffff, 1);
            char.graphics.strokeRect(0, 0, rectW, rectH);
            // Use character.type or name for display
            const displayName = char.name || char.type;
            // Adjusted font size and removed scaling
            char.text = this.add.text(rectX + rectW / 2, rectY + rectH / 2, `${displayName} Lvl ${char.level}`, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

            char.rectX = rectX;
            char.rectY = rectY;
            char.rectWidth = rectW;
            char.rectHeight = rectH;

            // Add HP bar below the character box
            const hpBarWidth = rectW;
            const hpBarHeight = 10; // Standard HP bar height
            const hpBarY = rectY + rectH; // 25 pixels below the box (shifted down by another 10)

            char.hpBar = this.add.graphics();
            char.hpBar.fillStyle(0x00ff00, 1); // Green color for HP
            char.hpBar.fillRect(rectX, hpBarY, hpBarWidth, hpBarHeight);

            // Ensure maxHp is set, default to current hp if not already set
            char.maxHp = char.maxHp || char.hp;

            // Adjusted font size and stroke thickness
            char.hpText = this.add.text(rectX + hpBarWidth / 2, hpBarY + hpBarHeight / 2, `${char.hp}/${char.maxHp}`, { fontSize: '24px', fill: '#fff' }) // Increased font size
                .setOrigin(0.5)
                .setStroke('#000000', 4); // Increased stroke thickness
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
        const attacker = this.playerTeam[Math.floor(Math.random() * this.playerTeam.length)];

        // Select a random active enemy character
        const target = this.enemyTeam[Math.floor(Math.random() * this.enemyTeam.length)];

        // Check if attacker and target are valid and have graphics objects
        if (!attacker || !attacker.graphics || !target || !target.graphics) {
             this.endBattle(); // Or perhaps just skip this attack turn
             return;
        }

        // Visual feedback for attack
        const yellowHighlight = this.add.graphics();
        yellowHighlight.lineStyle(4, 0xffff00, 1);
        yellowHighlight.strokeRect(attacker.graphics.x, attacker.graphics.y, attacker.rectWidth, attacker.rectHeight);
        const attackIndicator = this.drawAttackIndicator(attacker, target);

        // Shake target and temporarily change border to red
        this.shakeElement(target);

        // Calculate damage (simple attack - defense)
        const damage = Math.max(0, attacker.atk - target.def);
        target.hp -= damage;
        target.hp = Math.max(0, target.hp); // Ensure HP doesn't go below 0

        console.log(`Player ${attacker.name} attacks Enemy ${target.name || target.type} for ${damage} damage. Enemy HP: ${target.hp}`);

        // Update HP bar and text for the target
        this.updateHpDisplay(target);

        // Remove defeated enemy
        let targetDefeated = false;
        if (target.hp <= 0) {
            targetDefeated = true;
            this.enemyTeam = this.enemyTeam.filter(char => char !== target);
            target.graphics.destroy();
            target.text.destroy();
            target.hpBar.destroy(); // Destroy HP bar
            target.hpText.destroy(); // Destroy HP text
            console.log(`Enemy ${target.name || target.type} defeated!`);
        }

        // Revert visual changes and switch turn after a delay
        this.time.delayedCall(800, () => {
            attackIndicator.destroy();
            // redHighlight is removed
            yellowHighlight.destroy();
            // Border color is reset within shakeElement's onComplete
            // Redraw target white border only if it wasn't defeated and graphics exist (This might be redundant now)
            if (!targetDefeated && target.graphics && !target.graphics.isDestroyed) {
                 this.highlightBorder(target.graphics, target.rectX, target.rectY, target.rectWidth, target.rectHeight, 0xffffff, 2);
            }
            this.currentTurn = 'enemy';
            this.time.delayedCall(800, this.startTurn, [], this); // Start next turn
        }, [], this);
    }

    enemyAttack() {
        // Select a random active enemy character
        const attacker = this.enemyTeam[Math.floor(Math.random() * this.enemyTeam.length)];

        // Select a random active player character
        const target = this.playerTeam[Math.floor(Math.random() * this.playerTeam.length)];

        // Check if attacker and target are valid and have graphics objects
        if (!attacker || !attacker.graphics || !target || !target.graphics) {
             this.endBattle(); // Or perhaps just skip this attack turn
             return;
        }

        // Visual feedback for attack
        const yellowHighlight = this.add.graphics();
        yellowHighlight.lineStyle(4, 0xffff00, 1);
        yellowHighlight.strokeRect(attacker.graphics.x, attacker.graphics.y, attacker.rectWidth, attacker.rectHeight);
        const attackIndicator = this.drawAttackIndicator(attacker, target);

        // Shake target and temporarily change border to red
        this.shakeElement(target);

        // Calculate damage
        const damage = Math.max(0, attacker.atk - target.def);
        target.hp -= damage;
        target.hp = Math.max(0, target.hp); // Ensure HP doesn't go below 0

        console.log(`Enemy ${attacker.name || attacker.type} attacks Player ${target.name} for ${damage} damage. Player HP: ${target.hp}`);

        // Update HP bar and text for the target
        this.updateHpDisplay(target);

        // Remove defeated player
        let targetDefeated = false;
        if (target.hp <= 0) {
            targetDefeated = true;
            this.playerTeam = this.playerTeam.filter(char => char !== target);
            target.graphics.destroy();
            target.text.destroy();
            target.hpBar.destroy(); // Destroy HP bar
            target.hpText.destroy(); // Destroy HP text
            console.log(`Player ${target.name} defeated!`);
        }

        // Revert visual changes and switch turn after a delay
        this.time.delayedCall(800, () => {
            attackIndicator.destroy();
            // redHighlight is removed
            yellowHighlight.destroy();
            // Border color is reset within shakeElement's onComplete
            // Redraw target white border only if it wasn't defeated and graphics exist (This might be redundant now)
            if (!targetDefeated && target.graphics && !target.graphics.isDestroyed) {
                this.highlightBorder(target.graphics, target.rectX, target.rectY, target.rectWidth, target.rectHeight, 0xffffff, 2);
            }
            this.currentTurn = 'player';
            this.turnCounter++;
            this.turnText.setText(`Turn: ${this.turnCounter}`);
            this.time.delayedCall(800, this.startTurn, [], this); // Start next turn
        }, [], this);
    }

    updateHpDisplay(character) {
        if (!character || !character.hpBar || !character.hpText || !character.graphics || character.graphics.isDestroyed) {
            // Don't try to update display for destroyed characters
            return;
        }
        // Calculate HP percentage
        const hpPercentage = Math.max(0, character.hp / character.maxHp); // Ensure percentage is not negative

        // Update HP bar width
        const hpBarWidth = character.rectWidth * hpPercentage;
        character.hpBar.clear();
        character.hpBar.fillStyle(0x00ff00, 1); // Green color for HP
        character.hpBar.fillRect(character.rectX, character.rectY + character.rectHeight + 25, hpBarWidth, 10); // 25 pixels below the box (shifted down by another 10)

        // Update HP text
        character.hpText.setText(`${character.hp}/${character.maxHp}`);
        // Adjusted vertical position to be centered within the HP bar, shifted down by another 10
        character.hpText.setPosition(character.rectX + character.rectWidth / 2, character.rectY + character.rectHeight + 25 + 10 / 2);
    }

    drawAttackIndicator(attacker, target) {
        // console.log("Attacker:", attacker);
        // console.log("Target:", target);
        const line = this.add.graphics();
        line.lineStyle(2, 0xffff00, 1); // Yellow line, 2px thickness, 1 alpha
        // Use character's graphics object's scene position and rectangle dimensions
        const attackerCenterX = attacker.graphics.x + attacker.rectWidth / 2;
        const attackerCenterY = attacker.graphics.y + attacker.rectHeight / 2;
        const targetCenterX = target.graphics.x + target.rectWidth / 2;
        const targetCenterY = target.graphics.y + target.rectHeight / 2;
        line.lineBetween(attackerCenterX, attackerCenterY, targetCenterX, targetCenterY);
        return line;
    }

    highlightBorder(graphics, rectX, rectY, rectWidth, rectHeight, color, thickness) {
        if (!graphics || graphics.isDestroyed) return; // Check if graphics object exists
        graphics.clear();
        graphics.lineStyle(thickness, color, 1);
        // Draw rectangle at (0,0) relative to graphics object's position
        graphics.strokeRect(0, 0, rectWidth, rectHeight);
    }

    shakeElement(character) { // Removed highlightGraphics parameter
        if (!character || !character.graphics || character.graphics.isDestroyed) return; // Check if character and graphics exist

        const originalGraphicsX = character.graphics.x;
        const originalBorderColor = 0xffffff; // Assuming default is white
        const hitBorderColor = 0xff0000; // Red for hit
        const borderThickness = 2; // Assuming default thickness

        // Change border to red immediately
        this.highlightBorder(character.graphics, 0, 0, character.rectWidth, character.rectHeight, hitBorderColor, borderThickness);

        this.tweens.add({
            targets: character.graphics, // Shake the graphics object
            x: { from: originalGraphicsX, to: originalGraphicsX + 10 },
            ease: 'Sine.easeInOut', // Smoother shake
            duration: 50,
            repeat: 3, // Slightly more shakes
            yoyo: true,
            onComplete: () => {
                // Ensure graphics object returns to its original position and color if it still exists
                if (character.graphics && !character.graphics.isDestroyed) {
                    character.graphics.x = originalGraphicsX;
                    // Change border back to original color
                    this.highlightBorder(character.graphics, 0, 0, character.rectWidth, character.rectHeight, originalBorderColor, borderThickness);
                }
            }
        });

        // Shake text if it exists
        if (character.text && character.text.scene) { // Check if text exists and belongs to a scene
            const originalTextX = character.text.x;
             this.tweens.add({
                targets: character.text, // Shake the text object
                x: { from: originalTextX, to: originalTextX + 10 },
                ease: 'Sine.easeInOut',
                duration: 50,
                repeat: 3,
                yoyo: true,
                onComplete: () => {
                    // Check if character.text still exists before accessing x
                    if (character.text && character.text.scene) {
                        character.text.x = originalTextX;
                    }
                }
            });
        }
        // Removed tween for highlightGraphics
    }

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