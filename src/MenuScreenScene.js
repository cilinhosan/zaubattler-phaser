import Phaser from "phaser";
import MenuCharacter from "./game/MenuCharacter.js"; // Import MenuCharacter
import { getRandomCharacters } from "./game/starterCharacterPool.js"; // Import the new function
import GameDataManager from "./game/GameDataManager.js"; // Import the GameDataManager singleton
import menuBackground1 from '../assets/menu_background_illustration_1.jpg';
import fullscreenIcon from '../assets/fullscreen_icon.png'; // Import the fullscreen icon

class MenuScreenScene extends Phaser.Scene {
    constructor() {
        super({key: "MenuScreenScene"});
    }

    preload() {
        this.load.image('menuBg1', menuBackground1);
        this.load.image('fullscreenIcon', fullscreenIcon); // Load the fullscreen icon
    }

    create() {
        // Set background image
        let bg = this.add.image(0, 0, 'menuBg1').setOrigin(0, 0);
        let scaleX = this.cameras.main.width / bg.width;
        let scaleY = this.cameras.main.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);


        // Add Start Game button
        const startGameButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 50, "Start Game", { // Adjusted Y position
            fontSize: '64px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // Add outline rectangle for Start Game button
        const startGameOutline = this.add.graphics();
        startGameOutline.lineStyle(4, 0xffffff, 1);
        const startGameBounds = startGameButton.getBounds();
        startGameOutline.strokeRect(startGameBounds.x - 5, startGameBounds.y - 5, startGameBounds.width + 10, startGameBounds.height + 10);

        // Make Start Game button interactive
        startGameButton.setInteractive();
startGameButton.on('pointerover', () => startGameButton.setFill('#00ff00')); // Green on hover
        startGameButton.on('pointerout', () => startGameButton.setFill('#ffffff')); // White on hover out

// Add Instructions button
        const instructionsButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 50, "Instructions", { // Positioned below Start Game
            fontSize: '64px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // Add outline rectangle for Instructions button
        const instructionsOutline = this.add.graphics();
        instructionsOutline.lineStyle(4, 0xffffff, 1);
        const instructionsBounds = instructionsButton.getBounds();
        instructionsOutline.strokeRect(instructionsBounds.x - 5, instructionsBounds.y - 5, instructionsBounds.width + 10, instructionsBounds.height + 10);

        // Make Instructions button interactive
        instructionsButton.setInteractive();
instructionsButton.on('pointerover', () => instructionsButton.setFill('#00ff00')); // Green on hover
        instructionsButton.on('pointerout', () => instructionsButton.setFill('#ffffff')); // White on hover out
        // --- Create Starting Inventory and Team Immediately ---
        const playerInventory = [];
        // Get 2 random MenuCharacters for the player's starting team
        const playerTeam = getRandomCharacters(2);

        if (playerTeam.length < 2) {
             console.warn("Could not retrieve 2 characters from the pool. Check pool size and definitions.");
             // Handle this case - show error to user? Prevent starting?
             // For now, proceed even if the team is smaller than expected.
        }
        // Ensure playerTeam has at least null placeholders if fewer than 2 characters were found
        const initialTeam = [
            playerTeam.length > 0 ? playerTeam[0] : null,
            playerTeam.length > 1 ? playerTeam[1] : null
        ];

        // Add the initial team members to the inventory as well
        initialTeam.forEach(char => {
            if (char) playerInventory.push(char);
        });

        const katherineDefinitionId = 'katherine'; // Assuming 'katherine' is the definition ID
        for (let i = 0; i < 20; i++) {
            // Create a new MenuCharacter instance for each Katherine
            const katherineInstance = new MenuCharacter(katherineDefinitionId, 1); // Level 1
            playerInventory.push(katherineInstance);
        }
        console.log("Created starting inventory:", playerInventory);
        console.log("Created starting team:", initialTeam.filter(c => c !== null)); // Log only non-null team members

        // Initialize the Game Data Manager with character inventory and initial team
        // Note: initializeCharacterInventory also clears team slots, so call it first.
        GameDataManager.initializeCharacterInventory(playerInventory);
        GameDataManager.initializeTeam(initialTeam); // Pass the array that might contain nulls
        console.log("MenuScreenScene: Game state initialized.");
        // --- End Immediate Setup ---

        // Start Game Button click transitions
        startGameButton.on('pointerdown', () => {
            console.log("MenuScreenScene: Starting PreBattleSetupScene...");
            // Start PreBattleSetupScene without passing team/inventory data
            this.scene.start('PreBattleSetupScene', { /* battleIndex will default to 0 */ });
        });
// Instructions Button click transitions
        instructionsButton.on('pointerdown', () => {
            console.log("MenuScreenScene: Starting MenuInstructionScene..."); // Updated log
            // Start MenuInstructionScene
            this.scene.start('MenuInstructionScene'); // Updated scene key
        });

        // --- Add Fullscreen Button ---
        const padding = 20;
        const fullscreenButton = this.add.image(
            this.cameras.main.width - padding,
            padding,
            'fullscreenIcon' // Use the loaded image key
        )
        .setOrigin(1, 0) // Origin top-right
        .setInteractive();

        // Optionally, scale the icon if it's too large or small
        fullscreenButton.setScale(0.5); // Example: scale to 50%

        fullscreenButton.on('pointerdown', () => {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
                // Optionally change icon tint or texture if you have different states (e.g., fullscreen_exit_icon)
                // fullscreenButton.setTexture('fullscreenIcon'); // Assuming 'fullscreenIcon' is the "enter fullscreen" state
            } else {
                this.scale.startFullscreen();
                // Optionally change icon tint or texture
                // fullscreenButton.setTexture('fullscreenExitIcon'); // Example for an exit icon
            }
        });

        // Optional: Add hover effect (tinting for images)
        fullscreenButton.on('pointerover', () => fullscreenButton.setTint(0x00ff00)); // Green tint on hover
        fullscreenButton.on('pointerout', () => fullscreenButton.clearTint()); // Remove tint on hover out

    }
}

export default MenuScreenScene;