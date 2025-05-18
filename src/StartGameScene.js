import Phaser from "phaser";
import menuBackground7 from '../assets/menu_background_illustration_7.jpg';
import AudioManager from "./game/AudioManager"; // Import AudioManager

class StartGameScene extends Phaser.Scene {
    constructor() {
        super({ key: "StartGameScene" });
    }

    preload() {
        this.load.image('menuBg7', menuBackground7);
    }

    create() {
        // Initialize AudioManager
        // Check if an AudioManager instance already exists in the registry (e.g., from a previous game session)
        if (!this.registry.get('audioManager')) {
            this.audioManager = new AudioManager(this);
            this.registry.set('audioManager', this.audioManager);
            console.log('[StartGameScene] AudioManager created and registered.');
        } else {
            this.audioManager = this.registry.get('audioManager');
            // Update the scene context for the existing AudioManager if necessary,
            // though AudioManager primarily uses the scene for `this.sound` which should be fine.
            this.audioManager.scene = this; // Ensure current scene context
            console.log('[StartGameScene] AudioManager retrieved from registry.');
        }

        // Play initial menu music - REMOVED to respect browser autoplay policies.
        // Music will be started by MenuScreenScene after user interaction.
        // this.audioManager.playMenuMusic();
        console.log('[StartGameScene] AudioManager initialized. Music will be started by the next scene after user interaction.');

        // Set background image
        let bg = this.add.image(0, 0, 'menuBg7').setOrigin(0, 0);
        let scaleX = this.cameras.main.width / bg.width;
        let scaleY = this.cameras.main.height / bg.height;
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);

        // Add game title (Copied from MenuScreenScene)
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 4, "Zaubattler", {
            fontSize: '128px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // Add play button text (Copied from MenuScreenScene)
        const playText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 1.5, "Start Game", { // Changed text slightly
            fontSize: '64px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // Add outline rectangle (Copied from MenuScreenScene)
        const outline = this.add.graphics();
        outline.lineStyle(4, 0xffffff, 1);
        const textBounds = playText.getBounds();
        const playButtonPadding = { x: 10, y: 5 };
        const playButtonHitArea = new Phaser.Geom.Rectangle(
            textBounds.x - playButtonPadding.x,
            textBounds.y - playButtonPadding.y,
            textBounds.width + 2 * playButtonPadding.x,
            textBounds.height + 2 * playButtonPadding.y
        );
        outline.strokeRect(playButtonHitArea.x, playButtonHitArea.y, playButtonHitArea.width, playButtonHitArea.height); // Adjusted padding slightly

        // Make play text interactive via its outline
        // playText.setInteractive(); // No longer directly interactive
        outline.setInteractive(playButtonHitArea, Phaser.Geom.Rectangle.Contains);


        outline.on('pointerdown', () => { // Listener on outline
            // Transition to the MenuScreenScene where game setup occurs
            this.scene.start('MenuScreenScene');
        });

        let playButtonHoverTween = null;
        outline.on('pointerover', () => { // Listener on outline
            playText.setFill('#00ff00'); // Green on hover
            if (playButtonHoverTween) playButtonHoverTween.stop();
            playButtonHoverTween = this.tweens.add({
                targets: playText,
                alpha: { from: 1, to: 0.5 },
                ease: 'Sine.easeInOut',
                duration: 300,
                repeat: -1,
                yoyo: true
            });
        });

        outline.on('pointerout', () => { // Listener on outline
            playText.setFill('#fff'); // Back to white
            if (playButtonHoverTween) {
                playButtonHoverTween.stop();
                playButtonHoverTween = null;
            }
            playText.setAlpha(1);
        });
    }
}

export default StartGameScene;