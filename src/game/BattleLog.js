// src/game/BattleLog.js
import Phaser from "phaser";

const MAX_LOG_MESSAGES = 100;

class BattleLog {
    constructor(scene) {
        this.scene = scene;
        this.events = new Phaser.Events.EventEmitter(); // Add event emitter
        this.messages = [];
        this.isExpanded = false;
        this.scrollPosition = 0; // For text scrolling
        this.textMask = null; // For masking the scrollable text
        this.buttonInteractiveSetupDone = false; // Flag for one-time setup
        this.initialSetupDone = false; // Flag for emitting 'battleLogReady' only once
        this.isLogUiReady = false; // Roo: New flag to indicate if UI is ready for updates

        this.logHeightCollapsed = 40;
        this.logHeightExpanded = (this.scene.sys.game.config.height / 2);
        this.padding = 10;
        this.buttonWidth = 100; // Increased width for "Collapse"
        this.buttonHeight = this.logHeightCollapsed - (this.padding / 2);

        // Determine log container X and Width based on CharacterBattleDisplay constants
        // These are hardcoded for now based on CharacterBattleDisplay.js values
        // Ideally, these would be dynamically obtained or stored in a shared config
        const PLAYER_START_X = 181;
        const ENEMY_START_X = 1499;
        const BOX_WIDTH_CHAR_DISPLAY = 240; // from CharacterBattleDisplay
        const ACTUAL_BOX_WIDTH_CHAR_DISPLAY = BOX_WIDTH_CHAR_DISPLAY * 0.9 + 2;

        this.logContainerX = PLAYER_START_X + ACTUAL_BOX_WIDTH_CHAR_DISPLAY + this.padding;
        this.logContainerWidth = ENEMY_START_X - this.logContainerX - this.padding;


        // Container for the log
        this.containerGraphics = this.scene.add.graphics();
        this.containerGraphics.setScrollFactor(0).setDepth(1000);
        // this.containerGraphics.visible = false; // Visibility managed by BattleScene if needed

        // Text for the log messages
        this.logText = this.scene.add.text(
            this.logContainerX + this.padding, // Adjusted X
            0, // Y position will be updated in updateDisplay
            "Battle Log Initialized...",
            {
                fontSize: '16px',
                fill: '#ffffff',
                // Adjusted wordWrap width based on new container width and button
                wordWrap: { width: this.logContainerWidth - (this.padding * 2) - this.buttonWidth - this.padding },
                lineSpacing: 5
            }
        );
        this.logText.setScrollFactor(0).setDepth(1001);
        // this.logText.visible = false; // Visibility managed by BattleScene if needed

        // Button Graphics (for outline and fill)
        this.buttonGraphics = this.scene.add.graphics();
        this.buttonGraphics.setScrollFactor(0).setDepth(1000); // Behind button text
        // this.buttonGraphics.visible = false; // Visibility managed by BattleScene if needed

        // Expand/Collapse Button Text
        this.expandButton = this.scene.add.text(
            this.logContainerX + this.logContainerWidth - this.buttonWidth - this.padding,
            0, // Y position will be updated in updateDisplay
            "Expand",
            {
                fontSize: '16px',
                fill: '#ffffff', // White text
                // backgroundColor: '#000000', // Black fill handled by graphics
                padding: { x: 5, y: 5 }, // Keep padding for text within button area
                align: 'center'
            }
        )
         // .setInteractive({ useHandCursor: true }) // Interactivity will be on buttonGraphics
         .setOrigin(0.5, 0.5)
         .setScrollFactor(0)
         .setDepth(1001);
        // this.expandButton.visible = false; // Visibility managed by BattleScene if needed

        // Interactivity will be handled by buttonGraphics, which is updated in updateDisplay
        // We'll add listeners after buttonGraphics is first drawn/positioned in updateDisplay.
        // For now, prepare the handlers.

        this.handleExpandButtonPointerDown = () => {
            this.toggleExpand();
        };

        let expandButtonHoverTween = null;
        this.handleExpandButtonPointerOver = () => {
            this.expandButton.setFill('#00ff00'); // Green on hover
            if (expandButtonHoverTween) expandButtonHoverTween.stop();
            expandButtonHoverTween = this.scene.tweens.add({
                targets: this.expandButton,
                alpha: { from: 1, to: 0.5 },
                ease: 'Sine.easeInOut',
                duration: 300,
                repeat: -1,
                yoyo: true
            });
        };

        this.handleExpandButtonPointerOut = () => {
            this.expandButton.setFill('#ffffff'); // White on hover out
            if (expandButtonHoverTween) {
                expandButtonHoverTween.stop();
                expandButtonHoverTween = null;
            }
            this.expandButton.setAlpha(1);
        };

        // Mouse wheel listener for scrolling
        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (this.isExpanded) {
                // Check if pointer is over the log container area
                const gameHeight = this.scene.sys.game.config.height;
                const logAreaY = gameHeight - this.logHeightExpanded;
                if (pointer.y >= logAreaY && pointer.y <= gameHeight &&
                    pointer.x >= this.logContainerX && pointer.x <= this.logContainerX + this.logContainerWidth) {
                    
                    this.scrollPosition -= deltaY * 0.5; // Adjust scroll speed as needed
                    this.updateDisplay(); // Redraw to apply scroll // Roo: Added this method below
                }
            }
        });

        // Roo: Listen for internal event to process new messages
        this.events.on('newMessageInQueue', this.processMessageQueue, this);

        // The initial call to updateDisplay
        // will now be handled by BattleScene at the end of its create() method.
    }

    addMessage(message) {
        // console.log("BATTLE LOG (Class):", message); // Keep for dev if needed
        this.messages.push(message);
        if (this.messages.length > MAX_LOG_MESSAGES) {
            this.messages.shift();
        }
        // Roo: Emit an event so BattleLog can decide when to process the queue.
        this.events.emit('newMessageInQueue');
    }

    // Roo: New method to process queued messages
    processMessageQueue() {
        if (this.isLogUiReady) {
            this._performUpdateDisplay();
        }
    }

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
        // Roo: Only attempt to update display from toggleExpand if the UI is confirmed to be ready.
        if (this.isLogUiReady) {
            this._performUpdateDisplay();
        }
    }

    // Roo: Added method for scroll updates, guarded by UI readiness
    updateDisplay() {
        if (this.isLogUiReady) {
            this._performUpdateDisplay();
        }
    }

    // This is the private method that does the actual rendering.
    _performUpdateDisplay() {
        // Roo: Added detailed log for pre-condition check
        console.log("BattleLog: Entering _performUpdateDisplay. Checking pre-conditions:", {
            sceneExists: !!this.scene,
            sceneSysExists: !!(this.scene && this.scene.sys),
            sceneIsActive: !!(this.scene && this.scene.sys && this.scene.sys.isActive()),
            logTextExists: !!this.logText,
            logTextSceneExists: !!(this.logText && this.logText.scene)
        });

        if (!this.scene || !this.scene.sys || !this.scene.sys.isActive() || !this.logText || !this.logText.scene) {
            console.warn("BattleLog: Attempted _performUpdateDisplay when scene or logText not ready. Returning early."); // Roo: Enhanced log
            return;
        }
        const gameHeight = this.scene.sys.game.config.height; // Use game config height

        let currentLogHeight = this.isExpanded ? this.logHeightExpanded : this.logHeightCollapsed;
        let textContent = "";

        // --- Container Graphics ---
        this.containerGraphics.clear();
        this.containerGraphics.fillStyle(0x000000, 0.7); // Background for the log area
        this.containerGraphics.fillRect(
            this.logContainerX,
            gameHeight - currentLogHeight, // Use gameHeight
            this.logContainerWidth,
            currentLogHeight
        );

        this.expandButton.setText(this.isExpanded ? "Collapse" : "Expand");

        // Button position and graphics
        const buttonOuterPadding = 2; // Padding for the outline around the fill
        const buttonRectX = this.logContainerX + this.logContainerWidth - this.buttonWidth - this.padding;
        let buttonRectY;

        if (this.isExpanded) {
            buttonRectY = gameHeight - currentLogHeight + this.padding; // Use gameHeight
        } else {
            // Center button vertically in the collapsed bar
            buttonRectY = gameHeight - currentLogHeight + (this.logHeightCollapsed - this.buttonHeight) / 2; // Use gameHeight
        }

        // Set the position of the buttonGraphics GameObject
        this.buttonGraphics.setPosition(buttonRectX, buttonRectY);
        this.buttonGraphics.clear();
        this.buttonGraphics.fillStyle(0x000000, 1); // Black fill
        // Draw relative to the Graphics object's local origin (0,0)
        this.buttonGraphics.fillRect(0, 0, this.buttonWidth, this.buttonHeight);
        this.buttonGraphics.lineStyle(2, 0xffffff, 1); // White outline, 2px
        this.buttonGraphics.strokeRect(
            0 - buttonOuterPadding / 2, // Relative to (0,0)
            0 - buttonOuterPadding / 2, // Relative to (0,0)
            this.buttonWidth + buttonOuterPadding,
            this.buttonHeight + buttonOuterPadding
        );
        
        // Setup interactivity for the buttonGraphics directly here
        // Ensure it's done after positioning and drawing.
        if (this.buttonGraphics && this.scene && this.scene.sys && this.scene.sys.input && this.scene.sys.input.isActive()) {
            const hitArea = new Phaser.Geom.Rectangle(0, 0, this.buttonWidth, this.buttonHeight); // Local to buttonGraphics
            this.buttonGraphics.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

            if (!this.buttonInteractiveSetupDone) {
                this.buttonGraphics.on('pointerdown', this.handleExpandButtonPointerDown, this);
                this.buttonGraphics.on('pointerover', this.handleExpandButtonPointerOver, this);
                this.buttonGraphics.on('pointerout', this.handleExpandButtonPointerOut, this);
                this.buttonInteractiveSetupDone = true;
                console.log("BattleLog: buttonInteractiveSetupDone set to true."); // Roo: Added log
            }
        } else {
            console.warn("BattleLog: Skipping button interactivity in _performUpdateDisplay - essentials missing.", { // Roo: Enhanced log
                buttonGraphics: !!this.buttonGraphics,
                scene: !!this.scene,
                sceneSys: !!(this.scene && this.scene.sys),
                sceneInput: !!(this.scene && this.scene.sys && this.scene.sys.input),
                sceneInputActive: !!(this.scene && this.scene.sys && this.scene.sys.input && this.scene.sys.input.isActive())
            });
        }

        // Emit ready event after first successful positioning and interactivity setup
        if (!this.initialSetupDone && this.buttonInteractiveSetupDone) {
            this.initialSetupDone = true;
            this.events.emit('battleLogReady');
            console.log("BattleLog: Emitted battleLogReady event."); // Roo: Added log
            this.isLogUiReady = true; // Roo: UI is now confirmed to be ready
            console.log("BattleLog: isLogUiReady set to true."); // Roo: Added log
        } else {
             // Roo: Added else block for logging. Commented out for now to reduce noise, can be enabled if needed.
            // console.log(`BattleLog: battleLogReady not emitted. initialSetupDone: ${this.initialSetupDone}, buttonInteractiveSetupDone: ${this.buttonInteractiveSetupDone}`);
        }

        // Center text on the button graphics (using absolute coordinates)
        this.expandButton.setPosition(
            buttonRectX + this.buttonWidth / 2,
            buttonRectY + this.buttonHeight / 2
        );


        // --- Text Content and Masking ---
        if (this.isExpanded) {
            // Create or update mask for expanded view
            if (!this.textMask) {
                this.textMaskGraphics = this.scene.make.graphics();
                this.textMask = new Phaser.Display.Masks.GeometryMask(this.scene, this.textMaskGraphics);
                this.logText.setMask(this.textMask);
            }
            
            const gameHeight = this.scene.sys.game.config.height; // Use game config height
            const maskX = this.logContainerX + this.padding;
            const maskY = gameHeight - this.logHeightExpanded + this.padding; // Use gameHeight
            const maskWidth = this.logContainerWidth - (this.padding * 2);
            const maskHeight = this.logHeightExpanded - (this.padding * 2) - this.buttonHeight - this.padding; // Space for button

            this.textMaskGraphics.clear();
            this.textMaskGraphics.fillStyle(0xffffff); // Color doesn't matter for mask
            this.textMaskGraphics.fillRect(maskX, maskY, maskWidth, maskHeight);
            
            textContent = this.messages.join('\n');
            this.logText.setText(textContent);
            this.logText.setWordWrapWidth(maskWidth); // Word wrap within the mask width
            
            // Scrolling logic
            const textBounds = this.logText.getBounds();
            const maxScroll = Math.max(0, textBounds.height - maskHeight);
            this.scrollPosition = Phaser.Math.Clamp(this.scrollPosition, -maxScroll, 0);
            
            this.logText.setPosition(maskX, maskY + this.scrollPosition);

        } else {
            // Remove mask if it exists and log is collapsed
            if (this.textMask) {
                this.logText.clearMask();
                this.textMaskGraphics.destroy();
                this.textMaskGraphics = null;
                this.textMask = null;
            }
            this.scrollPosition = 0; // Reset scroll position

            textContent = this.messages.length > 0 ? this.messages[this.messages.length - 1] : "";
            this.logText.setWordWrapWidth(this.logContainerWidth - (this.padding * 2) - this.buttonWidth - this.padding);
            this.logText.setPosition(
                this.logContainerX + this.padding,
                this.scene.sys.game.config.height - currentLogHeight + (this.logHeightCollapsed - 16 - this.padding / 2) / 2 // Vertically centerish, use gameHeight
            );
            this.logText.setText(textContent);
        }

        // Visibility of these elements is assumed to be true by default,
        // or managed by the parent scene if a full-scene loading overlay is used.
        // No need to toggle visibility here anymore.
    }
    
    // Public method to trigger the initial display and allow BattleScene to control its timing.
    // Can also be used for subsequent forced refreshes if needed.
    triggerInitialDisplay() { // Roo: Renamed from updateDisplay for clarity
        console.log("BattleLog: triggerInitialDisplay called."); // Roo: Added log
        this._performUpdateDisplay(); // Direct call
    }

    // No setupButtonInteractivity method needed as it's part of _performUpdateDisplay

    destroy() {
        if (this.buttonGraphics && this.buttonGraphics.input) { // Check if input exists before trying to remove listeners
            this.buttonGraphics.off('pointerdown', this.handleExpandButtonPointerDown, this);
            this.buttonGraphics.off('pointerover', this.handleExpandButtonPointerOver, this);
            this.buttonGraphics.off('pointerout', this.handleExpandButtonPointerOut, this);
        }
        this.containerGraphics.destroy();
        this.logText.destroy();
        this.expandButton.destroy();
        if (this.buttonGraphics) this.buttonGraphics.destroy();
        if (this.textMaskGraphics) this.textMaskGraphics.destroy();
        // Remove wheel listener - important to prevent memory leaks
        if (this.scene && this.scene.input) {
            this.scene.input.off('wheel');
        }
        this.messages = [];
    }
}

export default BattleLog;