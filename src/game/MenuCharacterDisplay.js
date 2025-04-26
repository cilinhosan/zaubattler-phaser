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

class MenuCharacterDisplay extends Phaser.GameObjects.Container { // Inherit from Container
    constructor(scene, x, y, character) {
        super(scene, x, y); // Call Container constructor

        this.character = character;

        // Use fixed dimensions for the inventory display box
        this.rectWidth = 100; // Make it square, slightly larger than icon
        this.rectHeight = 100;

        // Store position relative to container (passed as x, y)
        // Note: Container's position is set by scene.add.existing(this) or similar
        // We draw elements relative to the container's origin (0,0)

        this.createDisplayElements();

        // Add the container itself to the scene (important!)
        // scene.add.existing(this); // This is handled in PreBattleSetupScene now
    }

    createDisplayElements() {
        // Graphics for the box and HP bar
        // --- Draw elements relative to the Container's origin (0,0) ---

        // Graphics for the box
        this.graphics = this.scene.add.graphics();
        this.graphics.lineStyle(2, 0xffffff, 1);
        // Draw at (0,0) relative to container
        this.graphics.strokeRect(0, 0, this.rectWidth, this.rectHeight);
        this.add(this.graphics); // Add graphics to the container

        // --- Add Icon ---
        // TODO: Use actual character icon if available, fallback to default
        // Get face icon key from definition, fallback to default character icon
        const definition = this.character.definition; // Assuming character instance has .definition
        const faceIconKey = definition?.faceIconKey || 'default_character_icon';
        try {
            // Ensure the icon key is valid and loaded
            if (this.scene.textures.exists(faceIconKey)) {
                // Center the 90x90 icon within the 100x100 box
                this.icon = this.scene.add.image(this.rectWidth / 2, this.rectHeight / 2, faceIconKey);
                this.icon.setDisplaySize(90, 90);
                this.add(this.icon); // Add icon to the container
            } else {
                 console.warn(`Face icon key '${faceIconKey}' not found for ${this.character.name}.`);
                 // Optionally add a placeholder graphic
            }
        } catch (e) {
            console.error(`Error creating icon for ${this.character.name}:`, e);
        }


        // Text for the character name (below the icon/box)
        const displayName = this.character.name || this.character.type || 'Unknown';
        this.text = this.scene.add.text(this.rectWidth / 2, this.rectHeight + 5, displayName, { // Position below box
            fontSize: '16px', // Smaller font for inventory
            fill: '#fff',
            align: 'center',
            wordWrap: { width: this.rectWidth - 10 } // Wrap text
        }).setOrigin(0.5, 0); // Origin at top-center
        this.add(this.text); // Add text to the container

        // Remove HP bar and HP text for inventory display (or make conditional)
        // this.hpBar = ...
        // this.hpText = ...
        // this.add(this.hpBar);
        // this.add(this.hpText);

        // Adjust container size based on content if needed, or use fixed size
        // For interaction, set the container's hit area
        const textHeight = this.text.getBounds().height;
        // Set container size to include the box and the text below it
        this.setSize(this.rectWidth, this.rectHeight + 5 + textHeight); // Keep container size calculation for layout
        // Make the container interactive using ONLY the box dimensions for now
        // Set interactive area to match the 100x100 box drawn at local (0,0)
        console.log(`[Debug MenuCharacterDisplay] Setting interactive hit area: 0, 0, ${this.rectWidth}, ${this.rectHeight}`);
        // this.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.rectWidth, this.rectHeight), Phaser.Geom.Rectangle.Contains); // REMOVED - Interaction handled by parent container


        // Remove direct assignment to character object - keep display separate
        // this.character.graphics = this.graphics;
        // ...
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

export default MenuCharacterDisplay;