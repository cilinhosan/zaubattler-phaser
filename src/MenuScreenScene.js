import Phaser from "phaser";
import MenuCharacter from "./game/MenuCharacter.js"; // Import MenuCharacter
import { getRandomCharacters } from "./game/starterCharacterPool.js"; // Import the new function
import GameDataManager from "./game/GameDataManager.js"; // Import the GameDataManager singleton

class MenuScreenScene extends Phaser.Scene {
    constructor() {
        super({key: "MenuScreenScene"});
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#1a1a1a'); // Dark grey color

        // Add game title
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 4, "Game Title", {
            fontSize: '128px', // Increased font size for 1080p
            fill: '#fff',
            align: 'center',
            resolution: window.devicePixelRatio // Match text resolution to screen DPR
        }).setOrigin(0.5);

        // Add play instruction
        const playText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 1.5, "Click to Play!", {
            fontSize: '64px', // Increased font size for 1080p
            fill: '#fff',
            align: 'center',
            resolution: window.devicePixelRatio // Match text resolution to screen DPR
        }).setOrigin(0.5);

        // Add outline rectangle
        const outline = this.add.graphics();
        outline.lineStyle(4, 0xffffff, 1); // White outline, 4px thickness, 1 alpha
        const textBounds = playText.getBounds();
        outline.strokeRect(textBounds.x - 5, textBounds.y - 5, textBounds.width + 10, textBounds.height + 10); // Add padding

        // Make play text interactive
        playText.setInteractive();

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

        // Initialize the Game Data Manager with inventory and initial team
        // Note: initializeInventory also clears team slots, so call it first.
        GameDataManager.initializeInventory(playerInventory);
        GameDataManager.initializeTeam(initialTeam); // Pass the array that might contain nulls
        console.log("MenuScreenScene: Game state initialized.");
        // --- End Immediate Setup ---

        // Button click now only transitions
        playText.on('pointerdown', () => {
            console.log("MenuScreenScene: Starting PreBattleSetupScene...");
            // Start PreBattleSetupScene without passing team/inventory data
            this.scene.start('PreBattleSetupScene', { /* battleIndex will default to 0 */ });
        });
    }
}

export default MenuScreenScene;