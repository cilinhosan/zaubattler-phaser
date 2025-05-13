import Phaser from 'phaser';
import GameDataManager from './game/GameDataManager.js'; // Import the GameDataManager
import MenuCharacterDisplay from './game/MenuCharacterDisplay.js'; // Import MenuCharacterDisplay
import menuBackground6 from '../assets/menu_background_illustration_6.jpg';

class EndGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndGameScene' });
    }

    preload() {
        // Load any assets needed for the end game screen, e.g., background
        // this.load.image('endBackground', 'assets/end_background.png');
        this.load.image('menuBg6', menuBackground6);
    }

    create(data) {
        // Set background image
        let bg = this.add.image(0, 0, 'menuBg6').setOrigin(0, 0);
        let scaleX = this.cameras.main.width / bg.width;
        let scaleY = this.cameras.main.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);
        // this.add.image(400, 300, 'endBackground');

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        let message = '';
        if (data.outcome === 'win') {
            message = 'Congratulations! You Won!';
        } else {
            message = 'Game Over!';
        }

        // Display the outcome message
        // Adjusted vertical position and font size
        this.add.text(centerX, centerY - 200, message, { // Moved up
            fontSize: '96px', // Increased font size
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // --- Display Survival Stats ---
        const battlesSurvived = GameDataManager.getCurrentBattleIndex(); // Get battles survived (index starts at 0)
        const finalTeam = GameDataManager.getActiveTeam(); // Get the active team members

        this.add.text(centerX, centerY - 100, `Battles Survived: ${battlesSurvived}`, {
            fontSize: '32px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // --- Display Final Team Slots ---
        this.add.text(centerX, centerY - 50, 'Final Team', { // Title for the slots
            fontSize: '32px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        const finalTeamSlots = GameDataManager.getTeamSlots(); // Get slots including nulls
        const slotWidth = 100;
        const slotHeight = 100;
        const slotSpacing = 20;
        const totalWidth = (slotWidth * finalTeamSlots.length) + (slotSpacing * (finalTeamSlots.length - 1));
        const startX = centerX - totalWidth / 2 + slotWidth / 2; // Center the group
        const slotY = centerY + 30; // Position below the title

        this.finalTeamDisplays = []; // Array to hold character display objects

        finalTeamSlots.forEach((charData, index) => {
            const slotX = startX + index * (slotWidth + slotSpacing);
            // Create the visual slot rectangle
            this.add.rectangle(slotX, slotY, slotWidth, slotHeight, 0x444444).setStrokeStyle(2, 0xffffff);

            if (charData) {
                // Create and position the character display inside the slot
                // MenuCharacterDisplay positions itself relative to its top-left corner
                const display = new MenuCharacterDisplay(this, slotX, slotY, charData);
                // Center the display within the slot rectangle visually
                display.setPosition(slotX - display.rectWidth / 2, slotY - display.rectHeight / 2);
                this.add.existing(display); // *** Explicitly add the container to the scene ***
                this.finalTeamDisplays.push(display);
            } else {
                this.finalTeamDisplays.push(null); // Keep track of empty slots if needed
            }
        });


        // --- Add a button to return to the menu ---
        // Adjusted vertical position further down
        const menuButtonY = slotY + slotHeight / 2 + 100; // Position below the slots
        const menuButton = this.add.text(centerX, menuButtonY, 'Return to Menu', {
            fontSize: '64px', // Increased font size
            fill: '#ffffff' // Start with white color
        })
            .setOrigin(0.5)
            .setInteractive();

        // Add outline to the menu button
        const buttonBounds = menuButton.getBounds();
        const buttonOutline = this.add.graphics();
        buttonOutline.lineStyle(2, 0xffffff, 1); // White outline
        buttonOutline.strokeRect(buttonBounds.x - 10, buttonBounds.y - 5, buttonBounds.width + 20, buttonBounds.height + 10); // Add padding

        // Ensure the outline is drawn relative to the potentially moved button
        this.children.bringToTop(buttonOutline); // Bring outline above button text if needed
        this.children.bringToTop(menuButton);    // Bring button text above outline

        menuButton.on('pointerdown', () => {
            // Reset global game state (inventory, team) before returning to menu
            GameDataManager.reset();
            this.scene.start('MenuScreenScene');
        });

         menuButton.on('pointerover', () => {
            menuButton.setFill('#00ff00'); // New Green on hover
        });

        menuButton.on('pointerout', () => {
            menuButton.setFill('#ffffff'); // Back to white
        });
    }

    update() {
        // Update logic if needed
    }
}

export default EndGameScene;