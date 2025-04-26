import Phaser from "phaser";

class StartGameScene extends Phaser.Scene {
    constructor() {
        super({ key: "StartGameScene" });
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#1a1a1a'); // Dark grey color

        // Add game title (Copied from MenuScreenScene)
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 4, "Zaubattler", {
            fontSize: '128px',
            fill: '#fff',
            align: 'center',
            resolution: window.devicePixelRatio
        }).setOrigin(0.5);

        // Add play button text (Copied from MenuScreenScene)
        const playText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 1.5, "Start Game", { // Changed text slightly
            fontSize: '64px',
            fill: '#fff',
            align: 'center',
            resolution: window.devicePixelRatio
        }).setOrigin(0.5);

        // Add outline rectangle (Copied from MenuScreenScene)
        const outline = this.add.graphics();
        outline.lineStyle(4, 0xffffff, 1);
        const textBounds = playText.getBounds();
        outline.strokeRect(textBounds.x - 10, textBounds.y - 5, textBounds.width + 20, textBounds.height + 10); // Adjusted padding slightly

        // Make play text interactive
        playText.setInteractive();

        playText.on('pointerdown', () => {
            // Transition to the MenuScreenScene where game setup occurs
            this.scene.start('MenuScreenScene');
        });

        playText.on('pointerover', () => {
            playText.setFill('#ff0'); // Yellow on hover
        });

        playText.on('pointerout', () => {
            playText.setFill('#fff'); // Back to white
        });
    }
}

export default StartGameScene;