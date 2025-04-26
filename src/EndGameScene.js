import Phaser from 'phaser';
import GameDataManager from './game/GameDataManager.js'; // Import the GameDataManager

class EndGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndGameScene' });
    }

    preload() {
        // Load any assets needed for the end game screen, e.g., background
        // this.load.image('endBackground', 'assets/end_background.png');
    }

    create(data) {
        // Optional: Add background image
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

        // Add a button to return to the menu
        // Adjusted vertical position and font size
        const menuButton = this.add.text(centerX, centerY + 200, 'Return to Menu', { // Moved down
            fontSize: '64px', // Increased font size
            fill: '#0f0' // Green color for the button
        })
            .setOrigin(0.5)
            .setInteractive();

        // Add outline to the menu button
        const buttonBounds = menuButton.getBounds();
        const buttonOutline = this.add.graphics();
        buttonOutline.lineStyle(2, 0xffffff, 1); // White outline
        buttonOutline.strokeRect(buttonBounds.x - 10, buttonBounds.y - 5, buttonBounds.width + 20, buttonBounds.height + 10); // Add padding

        menuButton.on('pointerdown', () => {
            // Reset global game state (inventory, team) before returning to menu
            GameDataManager.reset();
            this.scene.start('MenuScreenScene');
        });

         menuButton.on('pointerover', () => {
            menuButton.setFill('#ff0'); // Yellow on hover
        });

        menuButton.on('pointerout', () => {
            menuButton.setFill('#0f0'); // Back to green
        });
    }

    update() {
        // Update logic if needed
    }
}

export default EndGameScene;