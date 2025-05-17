import Phaser from 'phaser';
import AssetLoader from './AssetLoader.js'; // Import AssetLoader
import { getCharacterDefinition } from './CharacterDefinitionList.js'; // Corrected Import Path

export class CharacterProfileScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterProfileScene' });
        this.characterData = null;
        this.previousSceneKey = null;
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

        // Default icon keys (using camelCase for consistency with definition properties)
        const defaultLandscapeIllustrationKey = 'defaultLandscapeIllustration';
        const defaultLandscapeIllustrationPath = 'assets/default_character_illustration_landscape.jpg';

        // Load character-specific assets
        if (this.characterData && this.characterData.definition) {
            const def = this.characterData.definition;
            // More detailed logging for the definition object
            console.log(`[CharProfileScene.preload] Definition received for ${def.name}.`);
            console.log(`[CharProfileScene.preload] Keys in def: ${Object.keys(def).join(', ')}`);
            console.log(`[CharProfileScene.preload] def.landscapeIllustrationKey: "${def.landscapeIllustrationKey}"`);
            console.log(`[CharProfileScene.preload] def.landscapeIllustrationPath: "${def.landscapeIllustrationPath}"`);


            // Landscape Artwork (using landscapeIllustrationKey from definition)
            if (def.landscapeIllustrationKey && def.landscapeIllustrationPath) {
                assetLoader.preloadAsset(def.landscapeIllustrationKey, def.landscapeIllustrationPath, 'image');
                console.log(`[CharProfileScene.preload] Attempting to load specific illustration: Key="${def.landscapeIllustrationKey}", Path="${def.landscapeIllustrationPath}" for ${def.name}`);
            } else {
                console.log(`[CharProfileScene.preload] Specific landscapeIllustrationKey or Path missing for ${def.name}. Loading default: Key="${defaultLandscapeIllustrationKey}"`);
                assetLoader.preloadAsset(defaultLandscapeIllustrationKey, defaultLandscapeIllustrationPath, 'image');
            }
        } else {
            console.error("[CharProfileScene.preload] Character data or definition is missing entirely! Loading default illustration.");
            assetLoader.preloadAsset(defaultLandscapeIllustrationKey, defaultLandscapeIllustrationPath, 'image');
        }
        console.log('[CharProfileScene.preload] Preload finished.');
    }

    create() {
        console.log('[CharProfileScene.create] Creating scene. Character:', this.characterData?.name);
        const { width, height } = this.scale;

        // --- Full Screen Landscape Artwork ---
        const charDefForCreate = this.characterData?.definition;
        // Use string literal for the default key to avoid scope issues from preload
        let keyToUse = 'defaultLandscapeIllustration';

        if (charDefForCreate && charDefForCreate.landscapeIllustrationKey) {
            keyToUse = charDefForCreate.landscapeIllustrationKey;
            console.log(`[CharProfileScene.create] Wants to use specific key: "${keyToUse}" for ${charDefForCreate.name}`);
        } else {
            console.log(`[CharProfileScene.create] No specific landscapeIllustrationKey found for ${charDefForCreate?.name}. Defaulting to key: "${keyToUse}"`);
        }
        
        console.log(`[CharProfileScene.create] Final key for artwork: "${keyToUse}"`);

        if (this.textures.exists(keyToUse)) {
            const artwork = this.add.image(width / 2, height / 2, keyToUse).setOrigin(0.5, 0.5);
            const scale = Math.min(width / artwork.width, height / artwork.height);
            artwork.setScale(scale);
            console.log(`[CharProfileScene.create] Displaying texture: "${keyToUse}"`);
        } else {
            console.error(`[CharProfileScene.create] Texture with key "${keyToUse}" was NOT FOUND in cache. Displaying error text.`);
            this.add.graphics({ fillStyle: { color: 0x222222 } }).fillRect(0, 0, width, height);
            this.add.text(width / 2, height / 2, `Artwork Key Missing:\n${keyToUse}`, {
                fontFamily: 'serif', fontSize: '20px', color: '#FF0000', align: 'center',
                wordWrap: { width: width * 0.8 }
            }).setOrigin(0.5);
        }

        // --- Top Bar ---
        const headerHeight = 60;
        const topBar = this.add.graphics({ fillStyle: { color: 0x333333 } }); // Dark Gray
        topBar.fillRect(0, 0, width, headerHeight);

        // Back Button
        const backButton = this.add.text(40, headerHeight / 2, '← Back', {
            fontFamily: 'Arial, sans-serif', // Using a common sans-serif for UI elements
            fontSize: '20px',
            color: '#FFFFFF', // White text
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

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
            fontFamily: 'serif', // Serif for title as requested
            fontSize: '24px',
            color: '#FFFFFF', // White text
            align: 'center'
        }).setOrigin(0.5);

        // All other UI elements from the previous design are now removed.
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