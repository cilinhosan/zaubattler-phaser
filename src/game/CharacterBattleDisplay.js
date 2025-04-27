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

class CharacterBattleDisplay { // Renamed class
    constructor(scene, character, teamType, slotIndex) {
        this.scene = scene;
        this.character = character;
        this.teamType = teamType;
        this.slotIndex = slotIndex;

        // Calculate position based on team and slot index
        const startX = teamType === 'player' ? PLAYER_START_X : ENEMY_START_X;
        const startY = teamType === 'player' ? PLAYER_START_Y : ENEMY_START_Y;

        this.rectX = startX;
        this.rectY = startY + (BOX_HEIGHT + PADDING) * slotIndex;
        this.rectWidth = BOX_WIDTH;
        this.rectHeight = BOX_HEIGHT;

        this.createDisplayElements();
    }

    createDisplayElements() {
        // --- Calculate Target Dimensions ---
        const targetIconWidth = this.rectWidth * 0.9; // Based on original BOX_WIDTH
        const targetIconHeight = this.rectHeight * 0.9; // Based on original BOX_HEIGHT
        const boxWidth = targetIconWidth + 2; // Add 1px border on each side
        const boxHeight = targetIconHeight + 2; // Add 1px border on each side

        // --- Calculate Centered Positions ---
        // Use original rectX/rectY for consistent grid positioning calculation
        const centerX = this.rectX + this.rectWidth / 2;
        const centerY = this.rectY + this.rectHeight / 2;

        // Calculate top-left for the new tighter box based on center
        const boxX = centerX - boxWidth / 2;
        const boxY = centerY - boxHeight / 2;

        // --- Create Display Elements ---

        // Graphics for the box (Positioned at the new top-left)
        this.graphics = this.scene.add.graphics();
        this.graphics.setPosition(boxX, boxY); // Position graphics container
        this.graphics.lineStyle(1, 0xffffff, 1); // Use 1px line for tighter look
        this.graphics.strokeRect(0, 0, boxWidth, boxHeight); // Draw box relative to container

        // Image for the character battle icon (Positioned at the center)
        // Assumes the icon was loaded in BattleScene.preload
        // Access the key via the definition stored on the BattleCharacter instance
        const iconKey = this.character.definition?.battleIconKey; // Use optional chaining for safety
        if (!iconKey) {
            console.error(`CharacterBattleDisplay Error: Character ${this.character.name} definition is missing battleIconKey!`);
            this.icon = null;
        } else {
            console.log(`CharacterBattleDisplay: Attempting to create image for ${this.character.name} with key: ${iconKey}`);
            // Position icon at the calculated center
            this.icon = this.scene.add.image(centerX, centerY, iconKey);

            if (this.icon && this.icon.texture && this.icon.texture.key === iconKey) {
                 console.log(`  - Success: Image created for ${this.character.name}. Texture key: ${this.icon.texture.key}, Size: ${this.icon.width}x${this.icon.height}`);
                 // Scale the icon to the target size
                 this.icon.setDisplaySize(targetIconWidth, targetIconHeight);
                 console.log(`  - Scaled display size: ${this.icon.displayWidth}x${this.icon.displayHeight}`);
            } else if (this.icon) {
                 console.error(`  - Error: Image created for ${this.character.name}, BUT texture key is wrong or missing! Expected: ${iconKey}, Got: ${this.icon.texture?.key}`);
                 if (this.scene.textures.exists(iconKey)) {
                     console.error(`    - Texture '${iconKey}' EXISTS in manager, but wasn't applied correctly?`);
                 } else {
                     console.error(`    - Texture '${iconKey}' DOES NOT EXIST in manager. Loading issue in BattleScene.preload?`);
                 }
                 this.icon.setVisible(false);
            } else {
                 console.error(`  - Error: Failed to create image object for ${this.character.name} with key ${iconKey}.`);
            }
        }

        // HP bar (Positioned below the new box)
        const hpBarX = boxX; // Align with the box's left edge
        const hpBarY = boxY + boxHeight + HP_BAR_Y_OFFSET; // Position below the box
        const hpBarWidth = boxWidth; // Match the box width

        this.hpBar = this.scene.add.graphics();
        // Position the HP bar graphics object itself
        this.hpBar.setPosition(hpBarX, hpBarY);
        this.hpBar.fillStyle(0x00ff00, 1); // Green color for HP
        // Draw relative to the graphics object's position (0, 0)
        this.hpBar.fillRect(0, 0, hpBarWidth, HP_BAR_HEIGHT);

        // HP text - Centered on the new HP bar
        const initialHp = typeof this.character.getCurrentHp === 'function' ? this.character.getCurrentHp() : '?';
        const initialMaxHp = typeof this.character.getMaxHp === 'function' ? this.character.getMaxHp() : '?';
        this.hpText = this.scene.add.text(hpBarX + hpBarWidth / 2, hpBarY + HP_BAR_HEIGHT / 2, `${initialHp}/${initialMaxHp}`, {
            fontSize: '30px', // Increased font size for larger display
            fill: '#fff'
        })
        .setOrigin(0.5)
        .setStroke('#000000', 4); // Black stroke

        // Store references
        this.character.graphics = this.graphics;
        this.character.icon = this.icon;
        this.character.hpBar = this.hpBar;
        this.character.hpText = this.hpText;
        // Store the *actual* box dimensions used for display, not the original constants
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
        // Use the actual displayed box width for HP bar calculation
        const currentBoxWidth = this.character.rectWidth || this.rectWidth; // Fallback just in case
        const hpBarWidthValue = currentBoxWidth * hpPercentage;

        // Get the current position of the HP bar graphics object
        const hpBarX = this.hpBar.x; // Should be the same as boxX
        const hpBarY = this.hpBar.y; // Should be boxY + boxHeight + HP_BAR_Y_OFFSET

        this.hpBar.clear();
        this.hpBar.fillStyle(0x00ff00, 1);
        // Draw relative to the hpBar graphics object's position (which is already set)
        this.hpBar.fillRect(0, 0, hpBarWidthValue, HP_BAR_HEIGHT);

        this.hpText.setText(`${currentHp}/${maxHp}`);
        // Recenter text on the potentially changed HP bar
        this.hpText.setPosition(hpBarX + currentBoxWidth / 2, hpBarY + HP_BAR_HEIGHT / 2);
    }

    shake() {
        if (!this.graphics || this.graphics.isDestroyed) return;

        const originalGraphicsX = this.graphics.x;
        const originalBorderColor = 0xffffff;
        const hitBorderColor = 0xff0000;
        const borderThickness = 2;

        // Change border to red immediately
        this.highlightBorder(hitBorderColor, borderThickness); // Call with correct parameters

        this.scene.tweens.add({
            targets: this.graphics,
            x: { from: originalGraphicsX, to: originalGraphicsX + 10 },
            ease: 'Sine.easeInOut',
            duration: 50,
            repeat: 3,
            yoyo: true,
            onComplete: () => {
                // Reset position and border color after shake
                if (this.graphics && !this.graphics.isDestroyed) {
                    this.graphics.x = originalGraphicsX;
                    // Put back the border reset to default white
                    this.highlightBorder(originalBorderColor, borderThickness);
                }
            }
        });

        // Shake the icon as well (check if icon exists)
        if (this.icon && this.icon.scene) {
            const originalIconX = this.icon.x;
            this.scene.tweens.add({
                targets: this.icon,
                x: { from: originalIconX, to: originalIconX + 10 },
                ease: 'Sine.easeInOut',
                duration: 50,
                repeat: 3,
                yoyo: true,
                onComplete: () => {
                    if (this.icon && this.icon.scene) {
                        this.icon.x = originalIconX;
                    }
                }
            });
        }
    }

    // Modified highlightBorder to operate on this.graphics
    highlightBorder(color, thickness = 2) {
        if (!this.graphics || this.graphics.isDestroyed) return;
        // Use the actual displayed box dimensions
        const currentBoxWidth = this.character.rectWidth || this.rectWidth;
        const currentBoxHeight = this.character.rectHeight || this.rectHeight;
        this.graphics.clear();
        this.graphics.lineStyle(thickness, color, 1);
        this.graphics.strokeRect(0, 0, currentBoxWidth, currentBoxHeight);
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