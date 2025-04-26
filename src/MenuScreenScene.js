import Phaser from "phaser";
import MenuCharacter from "./game/MenuCharacter.js"; // Import MenuCharacter
import { getRandomCharacters } from "./game/starterCharacterPool.js"; // Import the new function

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
        playText.on('pointerdown', () => {
            // Get 2 random MenuCharacters for the player's starting team
            const playerTeam = getRandomCharacters(2);

            if (playerTeam.length < 2) {
                 console.warn("Could not retrieve 2 characters from the pool. Check pool size and definitions.");
                 // Handle this case - show error to user? Prevent starting?
                 // For now, proceed even if the team is smaller than expected.
            }

            // The commented-out enemy team creation is removed as PreBattleSetupScene handles it.

            // --- Create Starting Inventory ---
            const playerInventory = [];
            const katherineDefinitionId = 'katherine'; // Assuming 'katherine' is the definition ID
            for (let i = 0; i < 20; i++) {
                // Create a new MenuCharacter instance for each Katherine
                // Assign a unique ID if MenuCharacter requires/supports it, otherwise definitionId might suffice
                // For now, assuming MenuCharacter constructor takes definitionId and level
                const katherineInstance = new MenuCharacter(katherineDefinitionId, 1); // Level 1
                // You might want to add a unique identifier if needed later, e.g., katherineInstance.uniqueId = `katherine_${i}`;
                playerInventory.push(katherineInstance);
            }
            console.log("Created starting inventory:", playerInventory);


            // Pass the selected player team and the new inventory to PreBattleSetupScene.
            this.scene.start('PreBattleSetupScene', { playerTeam, playerInventory });
        });
    }
}

export default MenuScreenScene;