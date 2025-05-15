import Phaser from "phaser";
import menuBackground2 from '../assets/menu_background_illustration_2.jpg';

class MenuInstructionScene extends Phaser.Scene { // Renamed class
    constructor() {
        super({ key: "MenuInstructionScene" }); // Renamed scene key
    }

    preload() {
        this.load.image('menuBg2', menuBackground2);
    }

    create() {
        // Set background image
        let bg = this.add.image(0, 0, 'menuBg2').setOrigin(0, 0);
        let scaleX = this.cameras.main.width / bg.width;
        let scaleY = this.cameras.main.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);

        // Add Instructions Title
        this.add.text(this.cameras.main.width / 2, 100, "Instructions", {
            fontSize: '80px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // Add Instruction Text (Placeholder)
        const instructionsText = [
            "1. Assemble your team in the pre-battle screen.",
            "2. Select team members from your member reserve and move them to your team slots.",
            "3. See how many battles you can win consecutively.",
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
        const backButtonPadding = 5;
        const backButtonHitArea = new Phaser.Geom.Rectangle(
            backBounds.x - backButtonPadding,
            backBounds.y - backButtonPadding,
            backBounds.width + 2 * backButtonPadding,
            backBounds.height + 2 * backButtonPadding
        );
        backOutline.strokeRect(backButtonHitArea.x, backButtonHitArea.y, backButtonHitArea.width, backButtonHitArea.height);

        // Make Back button interactive via its outline
        // backButton.setInteractive(); // No longer directly interactive
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
        backOutline.on('pointerdown', () => { // Listener on outline
            console.log("MenuInstructionScene: Returning to MenuScreenScene..."); // Updated console log
            this.scene.start('MenuScreenScene');
        });
    }
}

export default MenuInstructionScene; // Renamed export