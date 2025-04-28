// src/game/CharacterBattleDisplay.js
import Phaser from 'phaser';

const MAX_SLOTS = 5;
const BOX_WIDTH = 240; // 160 * 1.5
const BOX_HEIGHT = 180; // 120 * 1.5 (Maintains 4:3 ratio)
const PADDING = 40; // 80 * 0.5 (Reduced spacing)

// Target: 10% margin from screen edge (192px on 1920 width) to the box edge
const PLAYER_START_X = 181; // Calculated for 10% margin (192px) to box edge
const PLAYER_START_Y = 400;

const ENEMY_START_X = 1499; // Calculated for 10% margin (192px) from right edge (1920px) to box edge
const ENEMY_START_Y = 400; // Adjusted for 1080p

const HP_BAR_HEIGHT = 10;
const HP_BAR_Y_OFFSET = 12.5; // Decreased by half (25 / 2)

class CharacterBattleDisplay {
    constructor(scene, character, teamType, teamIndex, teamSize) { // Added teamSize
        this.scene = scene;
        this.character = character;
        this.teamType = teamType;
        this.teamIndex = teamIndex;
        this.teamSize = teamSize; // Store team size
        this.isDestroyed = false; // Initialize destroyed flag

        // --- Calculate Actual Display Box Dimensions ---
        const targetIconWidth = BOX_WIDTH * 0.9;
        const targetIconHeight = BOX_HEIGHT * 0.9;
        this.actualBoxWidth = targetIconWidth + 2; // Store the calculated width
        this.actualBoxHeight = targetIconHeight + 2; // Store the calculated height

        // --- Calculate Centered Vertical Position ---
        const totalHeight = (this.teamSize * this.actualBoxHeight) + (Math.max(0, this.teamSize - 1) * PADDING);
        const screenCenterY = this.scene.cameras.main.height / 2; // Center of the screen vertically
        const groupStartY = screenCenterY - totalHeight / 2; // Top Y for the first character's box

        // Calculate the final absolute top-left Y for *this specific character's box*
        this.finalBoxY = groupStartY + (this.teamIndex * (this.actualBoxHeight + PADDING));

        // --- Calculate Horizontal Position ---
        this.finalBoxX = teamType === 'player' ? PLAYER_START_X : ENEMY_START_X;

        // Store base dimensions if needed elsewhere
        this.baseRectWidth = BOX_WIDTH;
        this.baseRectHeight = BOX_HEIGHT;

        // Create the visual elements using the calculated absolute positions
        this.createDisplayElements();
        this.updateHpDisplay(); // Update HP after creation
    }

    createDisplayElements() {
        // --- Use Dimensions and Absolute Positions Calculated in Constructor ---
        const boxWidth = this.actualBoxWidth;
        const boxHeight = this.actualBoxHeight;
        const boxX = this.finalBoxX; // Use final absolute X
        const boxY = this.finalBoxY; // Use final absolute Y

        const targetIconWidth = boxWidth - 2;
        const targetIconHeight = boxHeight - 2;
        const centerX = boxX + boxWidth / 2;
        const centerY = boxY + boxHeight / 2;

        // --- Create Display Elements Directly on Scene ---

        // Graphics for the box
        this.graphics = this.scene.add.graphics({ x: boxX, y: boxY }); // Position graphics object
        this.graphics.lineStyle(1, 0xffffff, 1);
        this.graphics.strokeRect(0, 0, boxWidth, boxHeight); // Draw relative to its position

        // Image for the character battle icon
        const iconKey = this.character.definition?.battleIconKey;
        if (!iconKey) {
            console.error(`CharacterBattleDisplay Error: Character ${this.character.name} definition is missing battleIconKey!`);
            this.icon = null;
        } else {
            console.log(`CharacterBattleDisplay: Attempting to create image for ${this.character.name} with key: ${iconKey}`);
            this.icon = this.scene.add.image(centerX, centerY, iconKey); // Position at absolute center

            if (this.icon && this.icon.texture && this.icon.texture.key === iconKey) {
                 console.log(`  - Success: Image created for ${this.character.name}.`);
                 this.icon.setDisplaySize(targetIconWidth, targetIconHeight);
                 console.log(`  - Scaled display size: ${this.icon.displayWidth}x${this.icon.displayHeight}`);
            } else if (this.icon) {
                 console.error(`  - Error: Image created for ${this.character.name}, BUT texture key is wrong or missing!`);
                 this.icon.setVisible(false);
            } else {
                 console.error(`  - Error: Failed to create image object for ${this.character.name}.`);
            }
        }

        // HP bar
        const hpBarX = boxX; // Absolute X
        const hpBarY = boxY + boxHeight + HP_BAR_Y_OFFSET; // Absolute Y
        const hpBarWidth = boxWidth;

        this.hpBar = this.scene.add.graphics({ x: hpBarX, y: hpBarY }); // Position graphics object
        this.hpBar.fillStyle(0x00ff00, 1);
        this.hpBar.fillRect(0, 0, hpBarWidth, HP_BAR_HEIGHT); // Draw relative to its position

        // HP text
        const initialHp = typeof this.character.getCurrentHp === 'function' ? this.character.getCurrentHp() : '?';
        const initialMaxHp = typeof this.character.getMaxHp === 'function' ? this.character.getMaxHp() : '?';
        this.hpText = this.scene.add.text(
            hpBarX + hpBarWidth / 2, // Absolute center X
            hpBarY + HP_BAR_HEIGHT / 2, // Absolute center Y
            `${initialHp}/${initialMaxHp}`,
            { fontSize: '30px', fill: '#fff' }
        )
        .setOrigin(0.5)
        .setStroke('#000000', 4);

        // Store references on the character object (as before)
        this.character.graphics = this.graphics;
        this.character.icon = this.icon;
        this.character.hpBar = this.hpBar;
        this.character.hpText = this.hpText;
        // Store the actual box dimensions used for display
        this.character.rectWidth = boxWidth;
        this.character.rectHeight = boxHeight;
    }

    updateHpDisplay() {
        // Add checks for isDestroyed flag and validity of hpBar/hpText
        if (this.isDestroyed || !this.graphics || this.graphics.destroyed || !this.hpBar || this.hpBar.destroyed || !this.hpText || !this.hpText.scene) {
             // console.warn("updateHpDisplay called on destroyed or invalid display for:", this.character?.name);
             return;
        }
        if (typeof this.character.getCurrentHp !== 'function' || typeof this.character.getMaxHp !== 'function') {
             console.warn("Character object missing HP methods for:", this.character?.name);
             return;
        }

        const currentHp = this.character.getCurrentHp();
        const maxHp = this.character.getMaxHp();
        const hpPercentage = maxHp > 0 ? Math.max(0, currentHp / maxHp) : 0; // Avoid division by zero
        // Use the stored actual box width
        const currentBoxWidth = this.actualBoxWidth;
        const hpBarWidthValue = currentBoxWidth * hpPercentage;

        // HP bar graphics object is already positioned absolutely
        this.hpBar.clear();
        this.hpBar.fillStyle(0x00ff00, 1);
        this.hpBar.fillRect(0, 0, hpBarWidthValue, HP_BAR_HEIGHT); // Draw relative to hpBar's origin

        // Update and re-center HP text (using absolute position)
        this.hpText.setText(`${currentHp}/${maxHp}`);
        const hpBarX = this.hpBar.x; // Get absolute X
        const hpBarY = this.hpBar.y; // Get absolute Y
        this.hpText.setPosition(
            hpBarX + currentBoxWidth / 2, // Absolute center X
            hpBarY + HP_BAR_HEIGHT / 2  // Absolute center Y
        );
    }

    shake() {
        if (!this.graphics || this.graphics.isDestroyed) return;

        // Use the stored absolute position as the base
        const originalGraphicsX = this.finalBoxX;
        const originalBorderColor = 0xffffff;
        const hitBorderColor = 0xff0000;
        const borderThickness = 2;

        // Change border to red immediately
        this.highlightBorder(hitBorderColor, borderThickness);

        // Tween the graphics object's absolute position
        this.scene.tweens.add({
            targets: this.graphics,
            x: { from: originalGraphicsX, to: originalGraphicsX + 10 }, // Tween absolute X
            ease: 'Sine.easeInOut',
            duration: 50,
            repeat: 3,
            yoyo: true,
            onComplete: () => {
                if (this.graphics && !this.graphics.destroyed) {
                    this.graphics.x = originalGraphicsX; // Reset absolute X
                    this.highlightBorder(originalBorderColor, borderThickness); // Reset border
                }
            }
        });

        // Shake the icon as well (using its absolute center position)
        if (this.icon && this.icon.scene) {
            const originalIconX = this.finalBoxX + this.actualBoxWidth / 2; // Original absolute center X
            this.scene.tweens.add({
                targets: this.icon,
                x: { from: originalIconX, to: originalIconX + 10 }, // Tween absolute X
                ease: 'Sine.easeInOut',
                duration: 50,
                repeat: 3,
                yoyo: true,
                onComplete: () => {
                    if (this.icon && this.icon.scene) {
                        this.icon.x = originalIconX; // Reset absolute X
                    }
                }
            });
        }
    }

    // Modified highlightBorder to operate on this.graphics
    highlightBorder(color, thickness = 2) {
        if (!this.graphics || this.graphics.isDestroyed) return;
        // Use the stored actual dimensions
        const currentBoxWidth = this.actualBoxWidth;
        const currentBoxHeight = this.actualBoxHeight;
        // Graphics object is already positioned absolutely
        this.graphics.clear();
        this.graphics.lineStyle(thickness, color, 1);
        this.graphics.strokeRect(0, 0, currentBoxWidth, currentBoxHeight); // Draw relative to its origin
    }

    // New method to clear the highlight and revert to default border
    clearHighlight() {
        this.highlightBorder(0xffffff, 2); // Revert to default white border with thickness 2
    }

    // New method to hide display elements
    hide() {
        if (this.graphics && !this.graphics.isDestroyed) this.graphics.setVisible(false);
        if (this.icon && this.icon.scene) this.icon.setVisible(false); // Use icon (check if exists)
        if (this.hpBar && !this.hpBar.isDestroyed) this.hpBar.setVisible(false);
        if (this.hpText && this.hpText.scene) this.hpText.setVisible(false);
    }

    // New method to show display elements
    show() {
        if (this.graphics && !this.graphics.isDestroyed) this.graphics.setVisible(true);
        if (this.icon && this.icon.scene) this.icon.setVisible(true); // Use icon (check if exists)
        if (this.hpBar && !this.hpBar.isDestroyed) this.hpBar.setVisible(true);
        if (this.hpText && this.hpText.scene) this.hpText.setVisible(true);
    }


    destroy() {
        if (this.graphics && !this.graphics.isDestroyed) this.graphics.destroy();
        if (this.icon && this.icon.scene) this.icon.destroy(); // Use icon (check if exists)
        if (this.hpBar && !this.hpBar.isDestroyed) this.hpBar.destroy();
        if (this.hpText && this.hpText.scene) this.hpText.destroy();
        this.isDestroyed = true; // Add a flag to prevent errors after destruction
    }

    // Method to reset the display state (e.g., after being defeated or for a new battle)
    resetDisplay() {
        if (this.isDestroyed) return; // Don't reset if already destroyed

        // Make elements visible again (in case they were hidden by defeat)
        this.show();

        // Reset border highlight to default
        this.clearHighlight();

        // Update HP display to reflect potentially reset character stats
        this.updateHpDisplay();
    }

    // Add showDefeated method (called from BattleCharacter)
    showDefeated() {
        if (this.isDestroyed) return;
        // Example: Make the display semi-transparent or apply a grayscale filter
        if (this.graphics) this.graphics.setAlpha(0.5);
        if (this.icon) this.icon.setAlpha(0.5); // Use icon (check if exists)
        if (this.hpBar) this.hpBar.setAlpha(0.5);
        if (this.hpText) this.hpText.setAlpha(0.5);
        // Optionally hide completely after an animation
        // this.hide();
    }
}

export default CharacterBattleDisplay; // Updated export