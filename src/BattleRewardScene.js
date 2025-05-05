import Phaser from 'phaser';
import GameDataManager from './game/GameDataManager'; // Import GameDataManager
// Import necessary components
import { getRandomCharacters } from './game/starterCharacterPool.js';
import MenuCharacterDisplay from './game/MenuCharacterDisplay.js';

export default class BattleRewardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleRewardScene' });
        this.rewardDisplays = []; // To store references
        this.recruitedInThisScene = new Set(); // Track recruited character IDs in this scene instance
    }

    preload() {
        // Preload assets if needed - Assuming face icons are loaded in PreloaderScene
    }

    create() {
        const gameDataManager = GameDataManager; // Use the imported instance directly
        this.recruitedInThisScene.clear(); // Reset recruited set for this instance

        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // Title
        this.add.text(screenCenterX, 50, 'Battle Rewards', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

        // --- Character Display Area ---
        const displayWidth = 100; // Width of MenuCharacterDisplay box
        const displayHeight = 100; // Height of MenuCharacterDisplay box (icon area)
        const totalDisplayHeight = 130; // Approximate total height including name text
        const numCharacters = 5;
        const spacing = (screenWidth - (numCharacters * displayWidth)) / (numCharacters + 1); // Calculate spacing

        // Get 5 random characters
        const randomCharacters = getRandomCharacters(numCharacters);

        if (randomCharacters.length < numCharacters) {
            console.warn(`BattleRewardScene: Could only get ${randomCharacters.length} characters, requested ${numCharacters}.`);
            // Handle case where fewer than 5 characters are available if necessary
        }

        this.rewardDisplays = []; // Clear previous displays if any

        for (let i = 0; i < randomCharacters.length; i++) {
            const character = randomCharacters[i]; // Character definition
            const displayCenterX = spacing * (i + 1) + displayWidth * i + displayWidth / 2;
            const displayCenterY = screenCenterY - 50; // Center Y position for the display group

            // Calculate top-left corner for the MenuCharacterDisplay container
            const displayX = displayCenterX - displayWidth / 2;
            const displayY = displayCenterY - displayHeight / 2; // Position based on the box part

            // Create and add the character display
            const characterDisplay = new MenuCharacterDisplay(this, displayX, displayY, character);
            this.add.existing(characterDisplay);

            // Cost text (Positioned above the display)
            const costText = this.add.text(displayCenterX, displayY - 20, 'Cost: 1 Ticket', { fontSize: '14px', fill: '#fff' }).setOrigin(0.5);

            // Recruit button (Positioned below the display)
            const buttonY = displayY + totalDisplayHeight + 10; // Place below the estimated total height

            // Recruit Button Text (Interactive)
            const recruitText = this.add.text(displayCenterX, buttonY, 'Recruit', { fontSize: '18px', fill: '#ffffff' }) // Start white
                .setOrigin(0.5)
                .setInteractive();

            // Recruit Button Outline
            const recruitButtonOutline = this.add.graphics();
            const textBounds = recruitText.getBounds();
            recruitButtonOutline.lineStyle(2, 0xffffff, 1);
            recruitButtonOutline.strokeRect(textBounds.x - 10, textBounds.y - 5, textBounds.width + 20, textBounds.height + 10);

            // Store references
            const rewardItem = {
                character: character,
                display: characterDisplay,
                costText: costText,
                recruitButton: recruitText, // Store the text as the interactive element
                recruitButtonOutline: recruitButtonOutline, // Store the outline
                recruitText: recruitText // Keep reference to text itself
            };
            this.rewardDisplays.push(rewardItem);

            // --- Add Recruitment Logic ---
            // --- Recruit Button Hover Effects ---
            let recruitHoverTween = null; // Variable to hold the tween

            recruitText.on('pointerover', () => {
                if (recruitText.input.enabled) { // Only tween if interactive
                    recruitText.setFill('#00ff00'); // Green text
                    // Start flashing tween
                    recruitHoverTween = this.tweens.add({
                        targets: recruitText,
                        alpha: { from: 1, to: 0.5 },
                        ease: 'Sine.easeInOut',
                        duration: 300,
                        repeat: -1, // Repeat indefinitely
                        yoyo: true // Go back and forth
                    });
                }
            });

            recruitText.on('pointerout', () => {
                if (recruitText.input.enabled) {
                    recruitText.setFill('#ffffff'); // Back to white
                    // Stop the tween and reset alpha
                    if (recruitHoverTween) {
                        recruitHoverTween.stop();
                        recruitHoverTween = null;
                    }
                    recruitText.setAlpha(1);
                }
            });

            // --- Add Recruitment Logic ---
            recruitText.on('pointerdown', () => { // Use recruitText for pointerdown
                // Check if already recruited in this scene instance
                if (this.recruitedInThisScene.has(character.id)) {
                    console.log(`Character ${character.name} already recruited in this scene.`);
                    return; // Already recruited here
                }

                // Check if player has enough tickets
                if (gameDataManager.getTickets() >= 1) {
                    // Attempt to spend ticket
                    if (gameDataManager.spendTickets(1)) {
                        // Add character to inventory
                        gameDataManager.addCharacterToInventory(character);
                        console.log(`Recruited ${character.name}!`);

                        // Mark as recruited for this scene
                        this.recruitedInThisScene.add(character.id);

                        // Disable button and update appearance
                        // Disable button and update appearance
                        recruitText.disableInteractive(); // Disable the text
                        recruitText.setFill('#888888'); // Grey out text
                        recruitButtonOutline.clear().lineStyle(2, 0x888888, 1).strokeRect(textBounds.x - 10, textBounds.y - 5, textBounds.width + 20, textBounds.height + 10); // Grey outline
                        recruitText.setText('Recruited');
                        // Stop hover effect if it was active
                        if (recruitHoverTween) {
                            recruitHoverTween.stop();
                            recruitHoverTween = null;
                        }
                        recruitText.setAlpha(1); // Ensure alpha is reset

                        // Update ticket display
                        this.ticketText.setText(`Tickets: ${gameDataManager.getTickets()}`);
                    } else {
                        // Should not happen if getTickets check passed, but good practice
                        console.warn("Failed to spend ticket even though check passed.");
                    }
                } else {
                    console.log("Not enough tickets to recruit.");
                    // Optionally provide visual feedback (e.g., shake button)
                }
            });
        }

        // Ticket Count Display
        this.ticketText = this.add.text(screenCenterX, screenHeight - 50, `Tickets: ${gameDataManager.getTickets()}`, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5); // Store reference

        // Next Battle Button
        // Next Battle Button Text (Interactive)
        const nextButtonText = this.add.text(screenWidth - 100, screenHeight - 50, 'Next Battle', { fontSize: '24px', fill: '#ffffff' }) // White text
            .setOrigin(0.5)
            .setInteractive();

        // Next Battle Button Outline
        const nextButtonOutline = this.add.graphics();
        const nextBounds = nextButtonText.getBounds();
        nextButtonOutline.lineStyle(2, 0xffffff, 1); // White outline
        nextButtonOutline.strokeRect(nextBounds.x - 10, nextBounds.y - 5, nextBounds.width + 20, nextBounds.height + 10);

        // Next Battle Button Hover Effects
        nextButtonText.on('pointerover', () => {
            nextButtonText.setFill('#00ff00'); // Green on hover
        });
        nextButtonText.on('pointerout', () => {
            nextButtonText.setFill('#ffffff'); // Back to white
        });

        // Next Battle Button Action
        nextButtonText.on('pointerdown', () => { // Use text for pointerdown
             console.log("Next Battle button clicked - transitioning...");
             this.scene.start('PreBattleSetupScene'); // Or wherever the game loop continues
        });
    }

    update() {
        // No dynamic updates needed here anymore, ticket count updated on recruit
    }
}