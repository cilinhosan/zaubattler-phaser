import Phaser from "phaser";
import Character from "./game/Character"; // Import Character class
import createCharacterPool from "./game/characterPool"; // Import the function

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
            // Select 2 random characters from the pool for the player team
            const playerTeam = [];
            const freshCharacterPool = createCharacterPool(); // Get a fresh pool
            const poolCopy = [...freshCharacterPool]; // Create a copy to avoid modifying the new pool

            for (let i = 0; i < 2; i++) {
                if (poolCopy.length > 0) {
                    const randomIndex = Math.floor(Math.random() * poolCopy.length);
                    playerTeam.push(poolCopy.splice(randomIndex, 1)[0]); // Remove and add character
                }
            }

            // Create enemy team (1 character - Wolf)
            // Assuming Wolf is always the first enemy for now based on previous instruction
            // const enemyTeam = [
            //      new Character("Wolf", { hp: 500, atk: 100, def: 70 }, "Fire", {}) // Using base stats and a default element for Wolf
            // ];


            // Pass player team to PreBattleSetupScene. PreBattleSetupScene will load the first battle's enemies.
            this.scene.start('PreBattleSetupScene', { playerTeam }); // Removed enemyTeam here
        });
    }
}

export default MenuScreenScene;