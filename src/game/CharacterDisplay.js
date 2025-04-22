import Phaser from 'phaser';

const MAX_SLOTS = 5;
const BOX_WIDTH = 150;
const BOX_HEIGHT = 180;
const PADDING = 40;

const PLAYER_START_X = 300;
const PLAYER_START_Y = 400;

const ENEMY_START_X = 1400; // Adjusted for 1080p
const ENEMY_START_Y = 400; // Adjusted for 1080p

const HP_BAR_HEIGHT = 10;
const HP_BAR_Y_OFFSET = 25; // Offset from the bottom of the box

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

        // HP text
        this.hpText = this.scene.add.text(this.rectX + this.rectWidth / 2, this.rectY + this.rectHeight + HP_BAR_Y_OFFSET + HP_BAR_HEIGHT / 2, `${this.character.hp}/${this.character.maxHp}`, {
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
        if (!this.graphics || this.graphics.isDestroyed) return; // Check if display is destroyed

        const hpPercentage = Math.max(0, this.character.hp / this.character.maxHp);
        const hpBarWidth = this.rectWidth * hpPercentage;

        this.hpBar.clear();
        this.hpBar.fillStyle(0x00ff00, 1);
        this.hpBar.fillRect(this.rectX, this.rectY + this.rectHeight + HP_BAR_Y_OFFSET, hpBarWidth, HP_BAR_HEIGHT);

        this.hpText.setText(`${this.character.hp}/${this.character.maxHp}`);
        this.hpText.setPosition(this.rectX + this.rectWidth / 2, this.rectY + this.rectHeight + HP_BAR_Y_OFFSET + HP_BAR_HEIGHT / 2);
    }

    shake() {
        if (!this.graphics || this.graphics.isDestroyed) return;

        const originalGraphicsX = this.graphics.x;
        const originalBorderColor = 0xffffff;
        const hitBorderColor = 0xff0000;
        const borderThickness = 2;

        // Change border to red immediately
        this.highlightBorder(this.graphics, 0, 0, this.rectWidth, this.rectHeight, hitBorderColor, borderThickness);

        this.scene.tweens.add({
            targets: this.graphics,
            x: { from: originalGraphicsX, to: originalGraphicsX + 10 },
            ease: 'Sine.easeInOut',
            duration: 50,
            repeat: 3,
            yoyo: true,
            onComplete: () => {
                if (this.graphics && !this.graphics.isDestroyed) {
                    this.graphics.x = originalGraphicsX;
                    // Change border back to original color
                    this.highlightBorder(this.graphics, 0, 0, this.rectWidth, this.rectHeight, originalBorderColor, borderThickness);
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

    highlightBorder(graphics, rectX, rectY, rectWidth, rectHeight, color, thickness) {
        if (!graphics || graphics.isDestroyed) return;
        graphics.clear();
        graphics.lineStyle(thickness, color, 1);
        graphics.strokeRect(0, 0, rectWidth, rectHeight);
    }

    destroy() {
        if (this.graphics && !this.graphics.isDestroyed) this.graphics.destroy();
        if (this.text && this.text.scene) this.text.destroy();
        if (this.hpBar && !this.hpBar.isDestroyed) this.hpBar.destroy();
        if (this.hpText && this.hpText.scene) this.hpText.destroy();
    }
}

export default CharacterDisplay;