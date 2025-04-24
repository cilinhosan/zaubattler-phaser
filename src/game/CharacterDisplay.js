import Phaser from 'phaser';

const MAX_SLOTS = 5;
const BOX_WIDTH = 150;
const BOX_HEIGHT = 180;
const PADDING = 60; // Increased by half (40 + 40/2)

const PLAYER_START_X = 300;
const PLAYER_START_Y = 400;

const ENEMY_START_X = 1400; // Adjusted for 1080p
const ENEMY_START_Y = 400; // Adjusted for 1080p

const HP_BAR_HEIGHT = 10;
const HP_BAR_Y_OFFSET = 12.5; // Decreased by half (25 / 2)

class CharacterDisplay {
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
        // Graphics for the box and HP bar
        this.graphics = this.scene.add.graphics();
        this.graphics.setPosition(this.rectX, this.rectY);
        this.graphics.lineStyle(2, 0xffffff, 1);
        this.graphics.strokeRect(0, 0, this.rectWidth, this.rectHeight);

        // Text for the character name
        const displayName = this.character.name || this.character.type;
        this.text = this.scene.add.text(this.rectX + this.rectWidth / 2, this.rectY + this.rectHeight / 2, displayName, {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // HP bar
        this.hpBar = this.scene.add.graphics();
        this.hpBar.fillStyle(0x00ff00, 1); // Green color for HP
        this.hpBar.fillRect(this.rectX, this.rectY + this.rectHeight + HP_BAR_Y_OFFSET, this.rectWidth, HP_BAR_HEIGHT);

        // HP text - Use getter methods
        const initialHp = typeof this.character.getCurrentHp === 'function' ? this.character.getCurrentHp() : '?';
        const initialMaxHp = typeof this.character.getMaxHp === 'function' ? this.character.getMaxHp() : '?';
        this.hpText = this.scene.add.text(this.rectX + this.rectWidth / 2, this.rectY + this.rectHeight + HP_BAR_Y_OFFSET + HP_BAR_HEIGHT / 2, `${initialHp}/${initialMaxHp}`, {
            fontSize: '24px',
            fill: '#fff'
        })
        .setOrigin(0.5)
        .setStroke('#000000', 4); // Black stroke

        // Store references to Phaser objects on the character object for easier access in BattleScene (e.g., for attack indicator)
        // This might be removed later if BattleScene only interacts with CharacterDisplay
        this.character.graphics = this.graphics;
        this.character.text = this.text;
        this.character.hpBar = this.hpBar;
        this.character.hpText = this.hpText;
        this.character.rectWidth = this.rectWidth; // Store dimensions too
        this.character.rectHeight = this.rectHeight;
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
        const hpBarWidth = this.rectWidth * hpPercentage;

        this.hpBar.clear();
        this.hpBar.fillStyle(0x00ff00, 1);
        this.hpBar.fillRect(this.rectX, this.rectY + this.rectHeight + HP_BAR_Y_OFFSET, hpBarWidth, HP_BAR_HEIGHT);

        this.hpText.setText(`${currentHp}/${maxHp}`);
        this.hpText.setPosition(this.rectX + this.rectWidth / 2, this.rectY + this.rectHeight + HP_BAR_Y_OFFSET + HP_BAR_HEIGHT / 2);
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

        if (this.text && this.text.scene) {
            const originalTextX = this.text.x;
            this.scene.tweens.add({
                targets: this.text,
                x: { from: originalTextX, to: originalTextX + 10 },
                ease: 'Sine.easeInOut',
                duration: 50,
                repeat: 3,
                yoyo: true,
                onComplete: () => {
                    if (this.text && this.text.scene) {
                        this.text.x = originalTextX;
                    }
                }
            });
        }
    }

    // Modified highlightBorder to operate on this.graphics
    highlightBorder(color, thickness = 2) {
        if (!this.graphics || this.graphics.isDestroyed) return;
        this.graphics.clear();
        this.graphics.lineStyle(thickness, color, 1);
        this.graphics.strokeRect(0, 0, this.rectWidth, this.rectHeight);
    }

    // New method to clear the highlight and revert to default border
    clearHighlight() {
        this.highlightBorder(0xffffff, 2); // Revert to default white border with thickness 2
    }

    // New method to hide display elements
    hide() {
        if (this.graphics && !this.graphics.isDestroyed) this.graphics.setVisible(false);
        if (this.text && this.text.scene) this.text.setVisible(false);
        if (this.hpBar && !this.hpBar.isDestroyed) this.hpBar.setVisible(false);
        if (this.hpText && this.hpText.scene) this.hpText.setVisible(false);
    }

    // New method to show display elements
    show() {
        if (this.graphics && !this.graphics.isDestroyed) this.graphics.setVisible(true);
        if (this.text && this.text.scene) this.text.setVisible(true);
        if (this.hpBar && !this.hpBar.isDestroyed) this.hpBar.setVisible(true);
        if (this.hpText && this.hpText.scene) this.hpText.setVisible(true);
    }


    destroy() {
        if (this.graphics && !this.graphics.isDestroyed) this.graphics.destroy();
        if (this.text && this.text.scene) this.text.destroy();
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
        if (this.text) this.text.setAlpha(0.5);
        if (this.hpBar) this.hpBar.setAlpha(0.5);
        if (this.hpText) this.hpText.setAlpha(0.5);
        // Optionally hide completely after an animation
        // this.hide();
    }
}

export default CharacterDisplay;