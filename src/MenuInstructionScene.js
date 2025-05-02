import Phaser from "phaser";

class MenuInstructionScene extends Phaser.Scene { // Renamed class
    constructor() {
        super({ key: "MenuInstructionScene" }); // Renamed scene key
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#1a1a1a'); // Dark grey color

        // Add Instructions Title
        this.add.text(this.cameras.main.width / 2, 100, "Instructions", {
            fontSize: '80px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // Add Instruction Text (Placeholder)
        const instructionsText = [
            "1. Assemble your team in the pre-battle screen.",
            "2. Select agents from your member reserve and move them to your team slots.",
            "3. Click 'Battle!' to start the fight.",
            "4. See how many fights you can win without dying.",
            "",
            "Good luck!"
        ];

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, instructionsText, {
            fontSize: '32px',
            fill: '#fff',
            align: 'center',
            wordWrap: { width: this.cameras.main.width - 100 } // Wrap text
        }).setOrigin(0.5);


        // Add Back button
        const backButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 100, "Back", {
            fontSize: '64px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // Add outline rectangle for Back button
        const backOutline = this.add.graphics();
        backOutline.lineStyle(4, 0xffffff, 1);
        const backBounds = backButton.getBounds();
        backOutline.strokeRect(backBounds.x - 5, backBounds.y - 5, backBounds.width + 10, backBounds.height + 10);

        // Make Back button interactive
        backButton.setInteractive();
        backButton.on('pointerover', () => backButton.setFill('#00ff00')); // Green on hover
        backButton.on('pointerout', () => backButton.setFill('#ffffff')); // White on hover out

        // Back Button click transitions
        backButton.on('pointerdown', () => {
            console.log("MenuInstructionScene: Returning to MenuScreenScene..."); // Updated console log
            this.scene.start('MenuScreenScene');
        });
    }
}

export default MenuInstructionScene; // Renamed export