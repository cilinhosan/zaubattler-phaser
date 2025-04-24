import Phaser from "phaser";
// Removed import for old Character class
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
                 // LLM TODO: Handle this case - show error to user? Prevent starting?
                 // For now, proceed even if the team is smaller than expected.
            }

            // The commented-out enemy team creation is removed as PreBattleSetupScene handles it.

            // Pass the selected player team (array of MenuCharacter instances) to PreBattleSetupScene.
            this.scene.start('PreBattleSetupScene', { playerTeam });
        });
    }
}

export default MenuScreenScene;