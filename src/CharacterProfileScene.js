import Phaser from 'phaser';
import AssetLoader from './AssetLoader.js'; // Import AssetLoader
import { getCharacterDefinition } from './CharacterDefinitionList.js'; // Corrected Import Path

export class CharacterProfileScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterProfileScene' });
        this.characterData = null;
        this.previousSceneKey = null;
        this.skillDescriptionContainer = null; // To hold the currently displayed skill description UI
        this.skillButtonObjects = []; // To hold references to skill button game objects
        this.skillListEndY = 0; // Y-coordinate after the last skill button
        this.backButtonHoverTween = null; // For the back button's hover tween
        // No need to store the definition separately here, it will be part of characterData
    }

    init(data) {
        this.characterData = data.characterData;
        this.previousSceneKey = data.previousSceneKey;

        // Ensure we have the LATEST definition by re-fetching it
        if (this.characterData && this.characterData.definitionId) {
            const freshDefinition = getCharacterDefinition(this.characterData.definitionId);
            if (freshDefinition) {
                // Overwrite the potentially stale definition on the characterData object
                this.characterData.definition = freshDefinition;
                console.log(`[CharProfileScene.init] Refreshed definition for ${this.characterData.name} using ID: ${this.characterData.definitionId}`);
            } else {
                console.error(`[CharProfileScene.init] Failed to refresh definition for ID: ${this.characterData.definitionId}. Using potentially stale data.`);
            }
        } else {
            console.warn('[CharProfileScene.init] Character data or definitionId missing, cannot refresh definition.');
        }
    }

    preload() {
        console.log('CharacterProfileScene preload. Character Data:', this.characterData);
        const assetLoader = new AssetLoader(this);

// Default icon keys
        const defaultProfileIllustrationKey = 'defaultProfileIllustration';
        // Path for default profile illustration (can be same as battle icon or specific)
        const defaultProfileIllustrationPath = 'assets/default_character_ilustration_4_3.png';

        // Load character-specific assets
        if (this.characterData && this.characterData.definition) {
            const def = this.characterData.definition;
            console.log(`[CharProfileScene.preload] Definition received for ${def.name}.`);
            console.log(`[CharProfileScene.preload] def.profileIllustrationKey: "${def.profileIllustrationKey}"`);
            console.log(`[CharProfileScene.preload] def.profileIllustrationPath: "${def.profileIllustrationPath}"`);

            // Profile Illustration
            if (def.profileIllustrationKey && def.profileIllustrationPath) {
                assetLoader.preloadAsset(def.profileIllustrationKey, def.profileIllustrationPath, 'image');
                console.log(`[CharProfileScene.preload] Attempting to load specific profile illustration: Key="${def.profileIllustrationKey}", Path="${def.profileIllustrationPath}" for ${def.name}`);
            } else {
                console.log(`[CharProfileScene.preload] Specific profileIllustrationKey or Path missing for ${def.name}. Loading default: Key="${defaultProfileIllustrationKey}"`);
                assetLoader.preloadAsset(defaultProfileIllustrationKey, defaultProfileIllustrationPath, 'image');
            }
        } else {
            console.error("[CharProfileScene.preload] Character data or definition is missing entirely! Loading default profile illustration.");
            assetLoader.preloadAsset(defaultProfileIllustrationKey, defaultProfileIllustrationPath, 'image');
        }
        console.log('[CharProfileScene.preload] Preload finished.');
    }

    create() {
        console.log('[CharProfileScene.create] Creating scene. Character:', this.characterData?.name);
        const { width, height } = this.scale;
        const charDef = this.characterData?.definition;

        this.skillButtonObjects = []; // Reset skill buttons array

        // --- Background ---
        this.add.graphics({ fillStyle: { color: 0x1c1c1c } }).fillRect(0, 0, width, height); // Dark background

        // --- Character Profile Illustration (Left Side) ---
        let illustrationKeyToUse = 'defaultProfileIllustration'; // Default key
        if (charDef && charDef.profileIllustrationKey && this.textures.exists(charDef.profileIllustrationKey)) {
            illustrationKeyToUse = charDef.profileIllustrationKey;
            console.log(`[CharProfileScene.create] Using specific profile illustration key: "${illustrationKeyToUse}" for ${charDef.name}`);
        } else {
            console.log(`[CharProfileScene.create] No specific profileIllustrationKey found or texture missing for ${charDef?.name}. Defaulting to key: "${illustrationKeyToUse}"`);
        }

        if (this.textures.exists(illustrationKeyToUse)) {
            const leftPanelWidth = width / 2;
            const icon = this.add.image(leftPanelWidth / 2, height / 2, illustrationKeyToUse).setOrigin(0.5, 0.5);

            // Scale to fill the height of the screen, maintaining aspect ratio.
            const scaleToFillHeight = height / icon.height;
            icon.setScale(scaleToFillHeight);

            // Ensure it's horizontally centered within the left panel.
            console.log(`[CharProfileScene.create] Displaying profile illustration: "${illustrationKeyToUse}", scaled to fill height.`);
        } else {
            console.error(`[CharProfileScene.create] Texture with key "${illustrationKeyToUse}" was NOT FOUND. Displaying error text on left.`);
            this.add.text(width / 4, height / 2, `Profile Illustration Missing:\n${illustrationKeyToUse}`, {
                fontFamily: 'Arial', fontSize: '36px', color: '#FF0000', align: 'center',
                wordWrap: { width: width / 2 * 0.8 }
            }).setOrigin(0.5);
        }


        // --- Right Panel for Stats and Skills ---
        const rightPanelX = width / 2;
        const panelPadding = 20;
        const contentStartX = rightPanelX + panelPadding;
        const contentWidth = width / 2 - (panelPadding * 2);
        let currentY = 80; // Start Y below top bar

        // Display Character Name
        if (charDef && charDef.name) {
            this.add.text(contentStartX, currentY, `Name: ${charDef.name}`, {
                fontFamily: 'Arial', fontSize: '40px', color: '#FFFFFF', fontStyle: 'bold'
            }).setOrigin(0, 0);
            currentY += 50; // Adjusted for larger font
        }
        
        // Display Character Stats
        if (charDef && charDef.stats) {
            this.add.text(contentStartX, currentY, 'Stats:', {
                fontFamily: 'Arial', fontSize: '36px', color: '#FFFFFF', fontStyle: 'bold'
            }).setOrigin(0, 0);
            currentY += 45; // Adjusted

            const statTextStyle = { fontFamily: 'Arial', fontSize: '32px', color: '#DDDDDD' };
            for (const [statName, statValue] of Object.entries(charDef.stats)) {
                let displayValue = statValue;
                if (statName === 'critChance' || statName === 'critDamage') {
                    displayValue = `${(statValue * 100).toFixed(0)}%`;
                }
                this.add.text(contentStartX + 10, currentY, `${statName.charAt(0).toUpperCase() + statName.slice(1)}: ${displayValue}`, statTextStyle).setOrigin(0, 0);
                currentY += 40; // Adjusted
            }
            currentY += 20; // Extra padding after stats
        } else {
            this.add.text(contentStartX, currentY, 'Stats not available.', { fontFamily: 'Arial', fontSize: '32px', color: '#FF8888' }).setOrigin(0, 0);
            currentY += 45; // Adjusted
        }

        // Display Skills and Passives
        if (charDef && charDef.skillMetadata) {
            this.add.text(contentStartX, currentY, 'Abilities:', {
                fontFamily: 'Arial', fontSize: '36px', color: '#FFFFFF', fontStyle: 'bold'
            }).setOrigin(0, 0);
            currentY += 45; // Adjusted

            const buttonHeight = 60; // Increased height for larger font
            const buttonSpacing = 15; // Increased spacing
            // New text style: white text
            const buttonTextStyle = { fontFamily: 'Arial', fontSize: '32px', color: '#FFFFFF', align: 'center'};
            const buttonWidth = contentWidth - 20;
            const outlineThickness = 2; // Thickness for the button outline

            let skillsDisplayed = 0;
            for (const skillKey in charDef.skillMetadata) {
                if (skillsDisplayed >= 4) break; // Limit to 4 buttons

                const skill = charDef.skillMetadata[skillKey];
                const buttonX = contentStartX + 10;
                const buttonY = currentY + (buttonHeight + buttonSpacing) * skillsDisplayed;

                // Graphics for button outline - THIS WILL BE INTERACTIVE
                const buttonOutline = this.add.graphics();
                buttonOutline.lineStyle(outlineThickness, 0xffffff, 1); // White outline
                // No fill, just stroke a rectangle. Using fillRoundedRect for consistency if we want rounded corners for the outline.
                // For a simple rectangle outline:
                buttonOutline.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
                // If rounded corners are desired for the outline (matching a potential fill):
                // buttonOutline.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 5);
                
                // Text for button (visual only, not interactive itself)
                const buttonText = this.add.text(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, `${skill.name} (${skill.type})`, buttonTextStyle).setOrigin(0.5);
                
                // Define the hit area for the buttonOutline graphics object
                const hitArea = new Phaser.Geom.Rectangle(buttonX, buttonY, buttonWidth, buttonHeight);
                
                let buttonHoverTween = null; // To store the tween for this specific button

                // Make the buttonOutline graphics object interactive
                buttonOutline.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
                    .on('pointerover', () => {
                        buttonText.setFill('#00FF00'); // Green text on hover
                        if (buttonHoverTween) buttonHoverTween.stop();
                        buttonHoverTween = this.tweens.add({
                            targets: buttonText,
                            alpha: { from: 1, to: 0.5 },
                            ease: 'Sine.easeInOut',
                            duration: 300,
                            repeat: -1,
                            yoyo: true
                        });
                        // Optionally change outline color/thickness on hover
                        // buttonOutline.clear();
                        // buttonOutline.lineStyle(outlineThickness, 0x00FF00, 1); // Green outline
                        // buttonOutline.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
                    })
                    .on('pointerout', () => {
                        buttonText.setFill('#FFFFFF'); // White text on hover out
                        if (buttonHoverTween) {
                            buttonHoverTween.stop();
                            buttonHoverTween = null; // Clear the tween reference
                        }
                        buttonText.setAlpha(1);
                        // Optionally revert outline
                        // buttonOutline.clear();
                        // buttonOutline.lineStyle(outlineThickness, 0xFFFFFF, 1); // White outline
                        // buttonOutline.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
                    })
                    .on('pointerdown', () => {
                        this.displaySkillDescription(skill, contentStartX, contentWidth);
                    });
                
                // Store the interactive graphics object (buttonOutline) and its hitArea
                this.skillButtonObjects.push({ graphics: buttonOutline, hitArea: hitArea, text: buttonText, hoverTween: buttonHoverTween });
                skillsDisplayed++;
            }
             currentY += (buttonHeight + buttonSpacing) * skillsDisplayed;
             this.skillListEndY = currentY; // Store the Y position after all skill buttons
        } else {
             this.add.text(contentStartX, currentY, 'Skills not available.', { fontFamily: 'Arial', fontSize: '32px', color: '#FF8888' }).setOrigin(0, 0);
             currentY += 45;
             this.skillListEndY = currentY; // Also store if no skills
        }

        // Scene-wide click listener to close description
        this.input.on('pointerdown', (pointer) => {
            if (this.skillDescriptionContainer) {
                // Check if the click was outside the description container
                const isClickOnDescription = this.skillDescriptionContainer.getBounds().contains(pointer.x, pointer.y);
                
                // Check if the click was on any skill button's hitArea
                const isClickOnSkillButton = this.skillButtonObjects.some(buttonObj => {
                    // buttonObj is { graphics: ..., hitArea: ... }
                    if (buttonObj && buttonObj.hitArea) {
                        return buttonObj.hitArea.contains(pointer.x, pointer.y);
                    }
                    return false;
                });

                if (!isClickOnDescription && !isClickOnSkillButton) {
                    this.closeSkillDescription();
                }
            }
        });


        // --- Top Bar (ensure it's drawn on top of other elements) ---
        const headerHeight = 60;
        const topBar = this.add.graphics({ fillStyle: { color: 0x333333 } }); // Dark Gray
        topBar.fillRect(0, 0, width, headerHeight);

        // Back Button
        const backButton = this.add.text(40, headerHeight / 2, '← Back', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '40px', // Increased
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setInteractive(); // Removed useHandCursor

        // Add hover effect to Back Button
        backButton.on('pointerover', () => {
            backButton.setFill('#00FF00'); // Green text on hover
            if (this.backButtonHoverTween) this.backButtonHoverTween.stop();
            this.backButtonHoverTween = this.tweens.add({
                targets: backButton,
                alpha: { from: 1, to: 0.5 },
                ease: 'Sine.easeInOut',
                duration: 300,
                repeat: -1,
                yoyo: true
            });
        });

        backButton.on('pointerout', () => {
            backButton.setFill('#FFFFFF'); // White text on hover out
            if (this.backButtonHoverTween) {
                this.backButtonHoverTween.stop();
                this.backButtonHoverTween = null;
            }
            backButton.setAlpha(1);
        });

        backButton.on('pointerdown', () => {
            if (this.previousSceneKey) {
                this.scene.stop();
                this.scene.wake(this.previousSceneKey);
            } else {
                // Fallback if no previous scene key (should not happen in this flow)
                this.scene.start('MenuScreenScene');
            }
        });

        // Title
        this.add.text(width / 2, headerHeight / 2, 'Character Profile', {
            fontFamily: 'serif',
            fontSize: '48px', // Increased
            color: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);

        // All other UI elements from the previous design are now removed.
    }

    displaySkillDescription(skill, x, maxWidth) {
        this.closeSkillDescription(); // Close any existing description

        const padding = 15;
        const titleStyle = { fontFamily: 'Arial', fontSize: '30px', color: '#FFFFFF', fontStyle: 'bold' };
        const descStyle = { fontFamily: 'Arial', fontSize: '26px', color: '#E0E0E0', wordWrap: { width: maxWidth - (padding * 2) } };
        
        // Position the container below the skill buttons list
        const containerY = this.skillListEndY + padding; // Add some padding below the list

        // Create a container for the description
        this.skillDescriptionContainer = this.add.container(x, containerY);
        this.skillDescriptionContainer.setDepth(100); // Ensure it's on top

        // Background for the description box
        // Create temporary texts to measure height accurately
        const tempTitleText = this.add.text(0, 0, skill.name, titleStyle).setVisible(false);
        const tempDescText = this.add.text(0, 0, skill.description, descStyle).setVisible(false);
        
        let requiredTextHeight = tempTitleText.height + tempDescText.height + padding * 3; // Title + Desc + 3 paddings
        tempTitleText.destroy();
        tempDescText.destroy();

        // Ensure the box doesn't go off the bottom of the screen
        const maxBoxHeight = this.scale.height - containerY - padding;
        if (requiredTextHeight > maxBoxHeight) {
            requiredTextHeight = maxBoxHeight;
            // If text height is clamped, you might want to enable scrolling for descStyle,
            // but Phaser's default text object doesn't support scrolling easily.
            // For now, it will just be cut off if too long and clamped.
            console.warn("Skill description too long for available space, may be cut off.");
        }


        const background = this.add.graphics({ fillStyle: { color: 0x2a2a2a, alpha: 0.95 } });
        background.fillRoundedRect(0, 0, maxWidth, requiredTextHeight, 8);
        background.lineStyle(2, 0x555555, 1); // Border
        background.strokeRoundedRect(0, 0, maxWidth, requiredTextHeight, 8);
        this.skillDescriptionContainer.add(background);
        

        // Skill Name
        const skillNameText = this.add.text(padding, padding, skill.name, titleStyle).setOrigin(0,0);
        this.skillDescriptionContainer.add(skillNameText);

        // Skill Description
        // Adjust descStyle if clamping height to prevent overflow, though this is a simplified approach
        const descRenderHeight = requiredTextHeight - skillNameText.height - padding * 3;
        const skillDescText = this.add.text(
            padding,
            skillNameText.y + skillNameText.height + padding / 2,
            skill.description,
            // If clamped, we might need to adjust wordWrap width or indicate truncation
            // For now, using original descStyle. If content overflows, it will be clipped by container bounds if we set a mask.
            // Phaser text objects don't have a built-in max height for rendering.
            descStyle
        ).setOrigin(0,0);
        this.skillDescriptionContainer.add(skillDescText);

        // If the text is very long and the box height was clamped, the text might overflow visually.
        // A proper solution would involve a scrollable text area or more complex text fitting.
    }

    closeSkillDescription() {
        if (this.skillDescriptionContainer) {
            this.skillDescriptionContainer.destroy();
            this.skillDescriptionContainer = null;
        }
    }

    update() {
        // Handle updates if necessary
    }
}

// Make sure to register the scene in your main game config
// e.g., in src/index.js
// import { CharacterProfileScene } from './CharacterProfileScene';
// const config = {
//   // ... other config
//   scene: [PreloaderScene, MenuScreenScene, /*...,*/ CharacterProfileScene]
// };