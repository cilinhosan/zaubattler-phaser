import Phaser from 'phaser';
import GameDataManager from './game/GameDataManager'; // Import GameDataManager
// Import necessary components
import { getRandomCharacters } from './game/starterCharacterPool.js';
import MenuCharacterDisplay from './game/MenuCharacterDisplay.js';
import menuBackground5 from '../assets/menu_background_illustration_5.jpg';

export default class BattleRewardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleRewardScene' });
        this.rewardDisplays = []; // To store references
        this.recruitedInThisScene = new Set(); // Track recruited character IDs in this scene instance
    }

    preload() {
        // Preload assets if needed - Assuming face icons are loaded in PreloaderScene
        this.load.image('menuBg5', menuBackground5);
    }

    create() {
        // Set background image
        let bg = this.add.image(0, 0, 'menuBg5').setOrigin(0, 0);
        let scaleX = this.cameras.main.width / bg.width;
        let scaleY = this.cameras.main.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);

        const gameDataManager = GameDataManager; // Use the imported instance directly
        this.recruitedInThisScene.clear(); // Reset recruited set for this instance

        const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // Title
        this.add.text(screenCenterX, 50, 'Battle Rewards', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5); // Increased size

        // --- Character Display Area ---
        // Use dimensions for "battle" style MenuCharacterDisplay
        const displayWidth = 240; // Width for battle style
        const displayHeight = 180; // Height for battle style
        // Estimate total height: box height + space + name text height
        // Name text font size is 24px for battle style. Approx height ~30px.
        const nameTextHeightEstimate = 30;
        const totalDisplayHeight = displayHeight + 5 + nameTextHeightEstimate; // Approximate total height including name text

        const numCharacters = 3; // Reduced for larger displays
        const spacing = (screenWidth - (numCharacters * displayWidth)) / (numCharacters + 1); // Calculate spacing

        // Get random characters
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

            // Create and add the character display using "battle" style
            const characterDisplay = new MenuCharacterDisplay(this, displayX, displayY, character, { style: 'battle' });
            this.add.existing(characterDisplay);

            // Cost text (Positioned above the display)
            // displayY is the top of the characterDisplay container
            const costText = this.add.text(displayCenterX, displayY - 30, 'Cost: 1 Ticket', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5); // Increased size, adjusted Y

            // Recruit button (Positioned below the display)
            // displayY + totalDisplayHeight is roughly the bottom of the character name text
            const buttonY = displayY + totalDisplayHeight + 30; // Place below the estimated total height, more spacing for larger button

            // Recruit Button Text (Interactive)
            const recruitText = this.add.text(displayCenterX, buttonY, 'Recruit', { fontSize: '27px', fill: '#ffffff' }) // Increased size
                .setOrigin(0.5)
                .setInteractive();

            // Recruit Button Outline - redraw after text potentially changes size
            const recruitButtonOutline = this.add.graphics();
            const textBounds = recruitText.getBounds(); // Get bounds of the now larger text
            recruitButtonOutline.lineStyle(2, 0xffffff, 1);
            // Adjust padding if necessary for larger text
            recruitButtonOutline.strokeRect(textBounds.x - 15, textBounds.y - 8, textBounds.width + 30, textBounds.height + 16);

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
                        // Update text and redraw outline for "Recruited" state
                        recruitText.setText('Recruited');
                        const newTextBounds = recruitText.getBounds(); // Get bounds of "Recruited"
                        recruitButtonOutline.clear().lineStyle(2, 0x888888, 1).strokeRect(newTextBounds.x - 15, newTextBounds.y - 8, newTextBounds.width + 30, newTextBounds.height + 16); // Grey outline
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
        this.ticketText = this.add.text(screenCenterX, screenHeight - 70, `Tickets: ${gameDataManager.getTickets()}`, { fontSize: '36px', fill: '#fff' }).setOrigin(0.5); // Increased size, adjusted Y

        // Next Battle Button
        // Next Battle Button Text (Interactive)
        const nextButtonText = this.add.text(screenWidth - 150, screenHeight - 70, 'Next Battle', { fontSize: '36px', fill: '#ffffff' }) // Increased size, adjusted X and Y
            .setOrigin(0.5)
            .setInteractive();

        // Next Battle Button Outline
        const nextButtonOutline = this.add.graphics();
        const nextBounds = nextButtonText.getBounds(); // Get bounds of the now larger text
        nextButtonOutline.lineStyle(2, 0xffffff, 1); // White outline
        // Adjust padding if necessary for larger text
        nextButtonOutline.strokeRect(nextBounds.x - 15, nextBounds.y - 8, nextBounds.width + 30, nextBounds.height + 16);

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
             // Clear the last battle result before transitioning
             GameDataManager.clearLastBattleResult();
             console.log("BattleRewardScene: Cleared lastBattleResult.");
             this.scene.start('PreBattleSetupScene'); // Or wherever the game loop continues
        });

        // It's also good practice to clear the result if the scene is shut down unexpectedly
        // or if there are other ways to exit it, though the button is the primary one.
        this.events.on('shutdown', () => {
            // Check if it was already cleared by the button press to avoid double logging
            if (GameDataManager.getLastBattleResult() !== GameDataManager.NO_BATTLE_RESULT) {
                GameDataManager.clearLastBattleResult();
                console.log("BattleRewardScene: Cleared lastBattleResult on shutdown.");
            }
        });
    }

    update() {
        // No dynamic updates needed here anymore, ticket count updated on recruit
    }
}