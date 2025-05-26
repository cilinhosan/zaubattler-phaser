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

        // Ensure menu music is playing when entering the reward scene
        const audioManager = this.registry.get('audioManager');
        if (audioManager) {
            audioManager.scene = this; // Ensure current scene context
            audioManager.playMenuMusic();
            console.log('[BattleRewardScene] Playing menu music.');
        } else {
            console.warn('[BattleRewardScene] AudioManager not found in registry. Menu music will not play.');
        }

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
                // .setInteractive(); // Text is no longer directly interactive

            // Recruit Button Outline - redraw after text potentially changes size
            const recruitButtonOutline = this.add.graphics();
            const textBounds = recruitText.getBounds(); // Get bounds of the now larger text
            const buttonPadding = { x: 15, y: 8 };
            const buttonRect = new Phaser.Geom.Rectangle(
                textBounds.x - buttonPadding.x,
                textBounds.y - buttonPadding.y,
                textBounds.width + 2 * buttonPadding.x,
                textBounds.height + 2 * buttonPadding.y
            );

            recruitButtonOutline.lineStyle(2, 0xffffff, 1);
            recruitButtonOutline.strokeRect(buttonRect.x, buttonRect.y, buttonRect.width, buttonRect.height);
            recruitButtonOutline.setInteractive(buttonRect, Phaser.Geom.Rectangle.Contains);


            // Store references
            const rewardItem = {
                character: character,
                display: characterDisplay,
                costText: costText,
                recruitButton: recruitButtonOutline, // Store the outline as the interactive element
                recruitButtonOutline: recruitButtonOutline,
                recruitText: recruitText
            };
            this.rewardDisplays.push(rewardItem);

            // --- Add Recruitment Logic ---
            // --- Recruit Button Hover Effects ---
            let recruitHoverTween = null; // Variable to hold the tween

            recruitButtonOutline.on('pointerover', () => {
                // Check if the recruitButtonOutline (the interactive element) is enabled
                if (recruitButtonOutline.input && recruitButtonOutline.input.enabled) {
                    recruitText.setFill('#00ff00'); // Green text
                    // Start flashing tween
                    if (recruitHoverTween) recruitHoverTween.stop(); // Stop previous tween if any
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

            recruitButtonOutline.on('pointerout', () => {
                // Check if the recruitButtonOutline (the interactive element) is enabled
                // (or was enabled, as pointerout might fire even if disabled during hover)
                // For simplicity, we can allow the color/alpha reset even if it became disabled.
                // The critical part is that 'pointerover' won't start a new tween if disabled.
                recruitText.setFill('#ffffff'); // Back to white
                // Stop the tween and reset alpha
                if (recruitHoverTween) {
                    recruitHoverTween.stop();
                    recruitHoverTween = null;
                }
                recruitText.setAlpha(1);
            });

            // --- Add Recruitment Logic ---
            recruitButtonOutline.on('pointerdown', () => { // Use recruitButtonOutline for pointerdown
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
                        recruitButtonOutline.disableInteractive(); // Disable the outline
                        recruitText.setFill('#888888'); // Grey out text
                        // Update text and redraw outline for "Recruited" state
                        recruitText.setText('Recruited');
                        // Recalculate bounds for the new text "Recruited"
                        const newTextBounds = recruitText.getBounds();
                        const newButtonRect = new Phaser.Geom.Rectangle(
                            newTextBounds.x - buttonPadding.x,
                            newTextBounds.y - buttonPadding.y,
                            newTextBounds.width + 2 * buttonPadding.x,
                            newTextBounds.height + 2 * buttonPadding.y
                        );
                        recruitButtonOutline.clear().lineStyle(2, 0x888888, 1).strokeRect(newButtonRect.x, newButtonRect.y, newButtonRect.width, newButtonRect.height); // Grey outline

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
            // .setInteractive(); // Text is no longer directly interactive

        // Next Battle Button Outline
        const nextButtonOutline = this.add.graphics();
        const nextTextBounds = nextButtonText.getBounds(); // Get bounds of the now larger text
        const nextButtonPadding = { x: 15, y: 8 };
        const nextButtonRect = new Phaser.Geom.Rectangle(
            nextTextBounds.x - nextButtonPadding.x,
            nextTextBounds.y - nextButtonPadding.y,
            nextTextBounds.width + 2 * nextButtonPadding.x,
            nextTextBounds.height + 2 * nextButtonPadding.y
        );

        nextButtonOutline.lineStyle(2, 0xffffff, 1); // White outline
        nextButtonOutline.strokeRect(nextButtonRect.x, nextButtonRect.y, nextButtonRect.width, nextButtonRect.height);
        nextButtonOutline.setInteractive(nextButtonRect, Phaser.Geom.Rectangle.Contains);


        // Next Battle Button Hover Effects
        let nextButtonHoverTween = null;
        nextButtonOutline.on('pointerover', () => {
            nextButtonText.setFill('#00ff00'); // Green on hover
            // Start flashing tween
            nextButtonHoverTween = this.tweens.add({
                targets: nextButtonText,
                alpha: { from: 1, to: 0.5 },
                ease: 'Sine.easeInOut',
                duration: 300,
                repeat: -1, // Repeat indefinitely
                yoyo: true
            });
        });
        nextButtonOutline.on('pointerout', () => {
            nextButtonText.setFill('#ffffff'); // Back to white
            if (nextButtonHoverTween) {
                nextButtonHoverTween.stop();
                nextButtonHoverTween = null;
            }
            nextButtonText.setAlpha(1);
        });

        // Next Battle Button Action
        nextButtonOutline.on('pointerdown', () => { // Use outline for pointerdown
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