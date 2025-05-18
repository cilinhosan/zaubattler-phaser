import Phaser from "phaser";
import menuBackground2 from '../assets/menu_background_illustration_2.jpg'; // Assuming same background

class MenuAboutScene extends Phaser.Scene {
    constructor() {
        super({ key: "MenuAboutScene" });
    }

    preload() {
        this.load.image('menuBg2', menuBackground2); // Re-use asset key if appropriate, or load a new one
    }

    create() {
        // Set background image
        let bg = this.add.image(0, 0, 'menuBg2').setOrigin(0, 0);
        let scaleX = this.cameras.main.width / bg.width;
        let scaleY = this.cameras.main.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);

        // Add About Title
        this.add.text(this.cameras.main.width / 2, 100, "About", {
            fontSize: '80px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // Add About Text
        const aboutTextLines = [
            "This is a prototype that is still in development.",
            "This game is an autobattler with strategy RPG elements.",
            "You should be able to collect many different characters and build your team from your member registry",
            "This is more of a proof of concept, and is missing many features and has only a few characters implemented to desmonstrate the game concept.",
            "This prototype version was developed over the course of 2 weeks.",
            "The long term goal would be an online game where players can either",
            "play the PVE side of the game or the PVP side."
        ];

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, aboutTextLines, {
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
        const backButtonPadding = 5;
        const backButtonHitArea = new Phaser.Geom.Rectangle(
            backBounds.x - backButtonPadding,
            backBounds.y - backButtonPadding,
            backBounds.width + 2 * backButtonPadding,
            backBounds.height + 2 * backButtonPadding
        );
        backOutline.strokeRect(backButtonHitArea.x, backButtonHitArea.y, backButtonHitArea.width, backButtonHitArea.height);

        // Make Back button interactive via its outline
        backOutline.setInteractive(backButtonHitArea, Phaser.Geom.Rectangle.Contains);

        let backButtonHoverTween = null;
        backOutline.on('pointerover', () => {
            backButton.setFill('#00ff00'); // Green on hover
            if (backButtonHoverTween) backButtonHoverTween.stop();
            backButtonHoverTween = this.tweens.add({
                targets: backButton,
                alpha: { from: 1, to: 0.5 },
                ease: 'Sine.easeInOut',
                duration: 300,
                repeat: -1,
                yoyo: true
            });
        });
        backOutline.on('pointerout', () => {
            backButton.setFill('#ffffff'); // White on hover out
            if (backButtonHoverTween) {
                backButtonHoverTween.stop();
                backButtonHoverTween = null;
            }
            backButton.setAlpha(1);
        });

        // Back Button click transitions
        backOutline.on('pointerdown', () => {
            console.log("MenuAboutScene: Returning to MenuScreenScene...");
            this.scene.start('MenuScreenScene');
        });
    }
}

export default MenuAboutScene;