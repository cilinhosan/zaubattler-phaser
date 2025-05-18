import Phaser from "phaser";
import MenuCharacter from "./game/MenuCharacter.js"; // Import MenuCharacter
import { getRandomCharacters } from "./game/starterCharacterPool.js"; // Import the new function
import GameDataManager from "./game/GameDataManager.js"; // Import the GameDataManager singleton
import menuBackground1 from '../assets/menu_background_illustration_1.jpg';
import fullscreenIcon from '../assets/fullscreen_icon.png'; // Import the fullscreen icon
// AudioManager is not directly imported as it's expected to be in the registry
// import AudioManager from "./game/AudioManager";

class MenuScreenScene extends Phaser.Scene {
    constructor() {
        super({key: "MenuScreenScene"});
    }

    preload() {
        this.load.image('menuBg1', menuBackground1);
        // Load UI icons directly in this scene's preload
        this.load.image('fullscreenIcon', fullscreenIcon);
        this.load.image('audio_on_icon', 'assets/ui_icon_audio_on.png'); // Use the direct path for clarity, key is 'audio_on_icon'
        this.load.image('audio_off_icon', 'assets/ui_icon_audio_off.png'); // Use the direct path, key is 'audio_off_icon'
    }

    create() {
        this.audioManager = this.registry.get('audioManager');
        if (this.audioManager) {
            // Ensure AudioManager is using the current scene context for sound operations
            this.audioManager.scene = this;
            
            // Play menu music if not already playing or if battle music was playing
            // This handles returning from a battle scene.
            // The `playMenuMusic` method in AudioManager will handle selecting a new track
            // if the last played was also menu music (due to `forceDifferent` logic).
            // We want a new menu song if we came from battle.
            if (!this.audioManager.currentMusic ||
                (this.audioManager.currentMusic && this.audioManager.currentMusic.key === this.audioManager.battleMusicKey)) {
                this.audioManager.playMenuMusic(true); // forceDifferent = true
                console.log('[MenuScreenScene] Playing new menu music after battle or if no music was playing.');
            } else if (this.audioManager.currentMusic && !this.audioManager.currentMusic.isPlaying) {
                // If menu music was paused or stopped for some reason, restart it.
                this.audioManager.playMenuMusic(false); // forceDifferent = false, might replay same if only one option
                 console.log('[MenuScreenScene] Restarting menu music.');
            }
        } else {
            console.warn('[MenuScreenScene] AudioManager not found in registry. Music will not play.');
        }

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
        const startGamePadding = 5;
        const startGameHitArea = new Phaser.Geom.Rectangle(
            startGameBounds.x - startGamePadding,
            startGameBounds.y - startGamePadding,
            startGameBounds.width + 2 * startGamePadding,
            startGameBounds.height + 2 * startGamePadding
        );
        startGameOutline.strokeRect(startGameHitArea.x, startGameHitArea.y, startGameHitArea.width, startGameHitArea.height);

        // Make Start Game button interactive via its outline
        // startGameButton.setInteractive(); // No longer directly interactive
        startGameOutline.setInteractive(startGameHitArea, Phaser.Geom.Rectangle.Contains);

        let startGameHoverTween = null;
        startGameOutline.on('pointerover', () => {
            startGameButton.setFill('#00ff00'); // Green on hover
            if (startGameHoverTween) startGameHoverTween.stop();
            startGameHoverTween = this.tweens.add({
                targets: startGameButton,
                alpha: { from: 1, to: 0.5 },
                ease: 'Sine.easeInOut',
                duration: 300,
                repeat: -1,
                yoyo: true
            });
        });
        startGameOutline.on('pointerout', () => {
            startGameButton.setFill('#ffffff'); // White on hover out
            if (startGameHoverTween) {
                startGameHoverTween.stop();
                startGameHoverTween = null;
            }
            startGameButton.setAlpha(1);
        });

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
        const instructionsPadding = 5;
        const instructionsHitArea = new Phaser.Geom.Rectangle(
            instructionsBounds.x - instructionsPadding,
            instructionsBounds.y - instructionsPadding,
            instructionsBounds.width + 2 * instructionsPadding,
            instructionsBounds.height + 2 * instructionsPadding
        );
        instructionsOutline.strokeRect(instructionsHitArea.x, instructionsHitArea.y, instructionsHitArea.width, instructionsHitArea.height);

        // Make Instructions button interactive via its outline
        // instructionsButton.setInteractive(); // No longer directly interactive
        instructionsOutline.setInteractive(instructionsHitArea, Phaser.Geom.Rectangle.Contains);

        let instructionsHoverTween = null;
        instructionsOutline.on('pointerover', () => {
            instructionsButton.setFill('#00ff00'); // Green on hover
            if (instructionsHoverTween) instructionsHoverTween.stop();
            instructionsHoverTween = this.tweens.add({
                targets: instructionsButton,
                alpha: { from: 1, to: 0.5 },
                ease: 'Sine.easeInOut',
                duration: 300,
                repeat: -1,
                yoyo: true
            });
        });
        instructionsOutline.on('pointerout', () => {
            instructionsButton.setFill('#ffffff'); // White on hover out
            if (instructionsHoverTween) {
                instructionsHoverTween.stop();
                instructionsHoverTween = null;
            }
            instructionsButton.setAlpha(1);
        });

        // Add About button
        const aboutButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 150, "About", { // Positioned below Instructions
            fontSize: '64px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        // Add outline rectangle for About button
        const aboutOutline = this.add.graphics();
        aboutOutline.lineStyle(4, 0xffffff, 1);
        const aboutBounds = aboutButton.getBounds();
        const aboutPadding = 5;
        const aboutHitArea = new Phaser.Geom.Rectangle(
            aboutBounds.x - aboutPadding,
            aboutBounds.y - aboutPadding,
            aboutBounds.width + 2 * aboutPadding,
            aboutBounds.height + 2 * aboutPadding
        );
        aboutOutline.strokeRect(aboutHitArea.x, aboutHitArea.y, aboutHitArea.width, aboutHitArea.height);

        // Make About button interactive via its outline
        aboutOutline.setInteractive(aboutHitArea, Phaser.Geom.Rectangle.Contains);

        let aboutHoverTween = null;
        aboutOutline.on('pointerover', () => {
            aboutButton.setFill('#00ff00'); // Green on hover
            if (aboutHoverTween) aboutHoverTween.stop();
            aboutHoverTween = this.tweens.add({
                targets: aboutButton,
                alpha: { from: 1, to: 0.5 },
                ease: 'Sine.easeInOut',
                duration: 300,
                repeat: -1,
                yoyo: true
            });
        });
        aboutOutline.on('pointerout', () => {
            aboutButton.setFill('#ffffff'); // White on hover out
            if (aboutHoverTween) {
                aboutHoverTween.stop();
                aboutHoverTween = null;
            }
            aboutButton.setAlpha(1);
        });
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

        // const katherineDefinitionId = 'katherine'; // Assuming 'katherine' is the definition ID
        // for (let i = 0; i < 20; i++) {
        //     // Create a new MenuCharacter instance for each Katherine
        //     const katherineInstance = new MenuCharacter(katherineDefinitionId, 1); // Level 1
        //     playerInventory.push(katherineInstance);
        // }
        console.log("Created starting inventory:", playerInventory);
        console.log("Created starting team:", initialTeam.filter(c => c !== null)); // Log only non-null team members

        // Initialize the Game Data Manager with character inventory and initial team
        // Note: initializeCharacterInventory also clears team slots, so call it first.
        GameDataManager.initializeCharacterInventory(playerInventory);
        GameDataManager.initializeTeam(initialTeam); // Pass the array that might contain nulls
        console.log("MenuScreenScene: Game state initialized.");
        // --- End Immediate Setup ---

        // Start Game Button click transitions
        startGameOutline.on('pointerdown', () => { // Listener on outline
            console.log("MenuScreenScene: Starting PreBattleSetupScene...");
            // Start PreBattleSetupScene without passing team/inventory data
            this.scene.start('PreBattleSetupScene', { /* battleIndex will default to 0 */ });
        });
// Instructions Button click transitions
        instructionsOutline.on('pointerdown', () => { // Listener on outline
            console.log("MenuScreenScene: Starting MenuInstructionScene..."); // Updated log
            // Start MenuInstructionScene
            this.scene.start('MenuInstructionScene'); // Updated scene key
        });

        // About Button click transitions
        aboutOutline.on('pointerdown', () => { // Listener on outline
            console.log("MenuScreenScene: Starting MenuAboutScene...");
            this.scene.start('MenuAboutScene');
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
        const fullscreenIconScale = 0.5; // Scale for the 160x160 fullscreen icon
        fullscreenButton.setScale(fullscreenIconScale);

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

        let fullscreenHoverTween = null;
        fullscreenButton.on('pointerover', () => {
            fullscreenButton.setTint(0x00ff00); // Green tint on hover
            if (fullscreenHoverTween) fullscreenHoverTween.stop();
            fullscreenHoverTween = this.tweens.add({
                targets: fullscreenButton,
                alpha: { from: 1, to: 0.5 },
                ease: 'Sine.easeInOut',
                duration: 300,
                repeat: -1,
                yoyo: true
            });
        });
        fullscreenButton.on('pointerout', () => {
            fullscreenButton.clearTint(); // Remove tint on hover out
            if (fullscreenHoverTween) {
                fullscreenHoverTween.stop();
                fullscreenHoverTween = null;
            }
            fullscreenButton.setAlpha(1);
        });

        // --- Add Audio Toggle Button ---
        // Position to the left of the fullscreen button
        const horizontalPaddingBetweenButtons = 10;
        const fullscreenButtonWidth = fullscreenButton.width * fullscreenIconScale; // Displayed width
        
        // X position for the audio button (its right edge)
        const audioButtonX = (this.cameras.main.width - padding - fullscreenButtonWidth) - horizontalPaddingBetweenButtons;
        const audioButtonY = padding; // Same Y as fullscreen button

        // Determine initial texture based on AudioManager's mute state
        let initialAudioIconKey = 'audio_on_icon'; // Default to 'on'
        if (this.audioManager && this.audioManager.isMuted()) {
            initialAudioIconKey = 'audio_off_icon';
        }

        this.audioToggleButton = this.add.image(
            audioButtonX,
            audioButtonY,
            initialAudioIconKey
        )
        .setOrigin(1, 0) // Origin top-right
        .setInteractive();

        // Calculate scale for audio icon (256x256 native) to match displayed height of fullscreen icon
        // Fullscreen displayed height = 160 * 0.5 = 80px
        // Audio icon scale = 80 / 256 = 0.3125
        const audioIconScale = (160 * fullscreenIconScale) / 256;
        this.audioToggleButton.setScale(audioIconScale);

        this.audioToggleButton.on('pointerdown', () => {
            if (this.audioManager) {
                const MUTE_STATE_BEFORE_TOGGLE = this.audioManager.isMuted();
                console.log(`[MenuScreenScene] AudioButton click. Mute state BEFORE toggle: ${MUTE_STATE_BEFORE_TOGGLE}`);

                const isNowMuted = this.audioManager.toggleMute(); // toggleMute itself logs the new state
                
                const newTextureKey = isNowMuted ? 'audio_off_icon' : 'audio_on_icon';
                this.audioToggleButton.setTexture(newTextureKey);
                console.log(`[MenuScreenScene] AudioButton texture set to: ${newTextureKey}`);
            } else {
                console.warn('[MenuScreenScene] AudioButton clicked, but no audioManager found.');
            }
        });

        let audioHoverTween = null;
        this.audioToggleButton.on('pointerover', () => {
            this.audioToggleButton.setTint(0x00ff00);
            if (audioHoverTween) audioHoverTween.stop();
            audioHoverTween = this.tweens.add({
                targets: this.audioToggleButton,
                alpha: { from: 1, to: 0.5 },
                ease: 'Sine.easeInOut',
                duration: 300,
                repeat: -1,
                yoyo: true
            });
        });
        this.audioToggleButton.on('pointerout', () => {
            this.audioToggleButton.clearTint();
            if (audioHoverTween) {
                audioHoverTween.stop();
                audioHoverTween = null;
            }
            this.audioToggleButton.setAlpha(1);
        });

    }
}

export default MenuScreenScene;