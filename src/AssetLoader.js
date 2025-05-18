// src/AssetLoader.js

/**
 * Handles loading assets dynamically based on the asset manifest.
 * This version uses the manifest for path resolution but does not
 * know about specific game concepts like characters. It requires the calling
 * code to provide the correct Phaser key, original source path, and asset type.
 */
class AssetLoader {
    /**
     * @param {Phaser.Scene} scene The scene instance requesting the load.
     */
    constructor(scene) {
        this.scene = scene;
        this.loader = scene.load;
        this.textures = scene.textures;
        // Add other caches if needed (audio, etc.)
        this.audioCache = scene.cache.audio;

        this.manifest = scene.registry.get('assetManifest');

        if (!this.manifest) {
            console.error('AssetLoader Error: Asset Manifest not found in registry!');
            // Optionally throw an error or set a flag to prevent loading attempts
        }
    }

    /**
     * Finds the hashed path for a given source asset path using the manifest.
     * @param {string} sourcePath The original source path (e.g., 'assets/image.png').
     * @returns {string|null} The hashed path (e.g., '/assets/image.12345.png') or null if not found.
     */
    getAssetPath(sourcePath) {
        if (!this.manifest || !sourcePath) {
            // console.warn(`[AssetLoader.getAssetPath] Called with invalid manifest or sourcePath: ${sourcePath}`);
            return null;
        }

        // Normalize keys: remove potential leading './' and use forward slashes
        // (This logic should match how keys were generated in WebpackManifestPlugin)
        const normalizedSourcePath = sourcePath.replace(/^\.\//, '').replace(/\\/g, '/');

        // Check common variations if the direct path isn't found
        const possibleKeys = [
            normalizedSourcePath,
            `./${normalizedSourcePath}`, // Sometimes manifests include './'
            // Add other variations if your manifest keys look different
        ];

        // console.log(`[AssetLoader.getAssetPath] Trying to resolve sourcePath: '${sourcePath}' (normalized: '${normalizedSourcePath}')`);
        for (const key of possibleKeys) {
            // console.log(`[AssetLoader.getAssetPath] Checking manifest key: '${key}'`);
            // Use hasOwnProperty for safer check against prototype properties
            if (Object.prototype.hasOwnProperty.call(this.manifest, key)) {
                 const hashedPath = this.manifest[key];
                 // console.log(`[AssetLoader.getAssetPath] Found match for key '${key}': ${hashedPath}`);

                 // Basic validation: Ensure it's a string and looks like a path
                 if (typeof hashedPath === 'string' && (hashedPath.startsWith('/') || hashedPath.startsWith('http'))) {
                    return hashedPath;
                 } else {
                    console.warn(`[AssetLoader.getAssetPath] Manifest entry for key '${key}' has unexpected value: '${hashedPath}'. Expected a valid path string.`);
                 }
            }
        }

        console.warn(`[AssetLoader.getAssetPath] Source path '${sourcePath}' (normalized: '${normalizedSourcePath}') NOT found in manifest! Tried keys:`, possibleKeys);
        if (this.manifest) {
            console.log('[AssetLoader.getAssetPath] Sample of available manifest keys (up to 10):', Object.keys(this.manifest).slice(0, 10));
            if (Object.keys(this.manifest).length === 0) {
                console.warn('[AssetLoader.getAssetPath] The assetManifest appears to be empty.');
            }
        } else {
            console.error('[AssetLoader.getAssetPath] this.manifest is null or undefined at the point of failure.');
        }
        return null; // Return null explicitly if not found
    }

    /**
     * Preloads a single asset by its original source path if not already loaded/queued.
     * @param {string} phaserKey The key to use within Phaser's caches (e.g., 'elzette_face_icon').
     * @param {string} originalPath The original source path used in the manifest (e.g., 'assets/elzette_illustration_face_icon.png').
     * @param {string} assetType The type of asset ('image', 'audio', 'spritesheet', etc.). Defaults to 'image'.
     * @param {object} [config] Optional configuration for complex asset types (e.g., { frameWidth: 32, frameHeight: 32 } for spritesheet).
     */
    preloadAsset(phaserKey, originalPath, assetType = 'image', config = null) {
        if (!this.manifest) {
            console.error(`[AssetLoader.preloadAsset] Cannot preload '${phaserKey}', manifest missing.`);
            return;
        }
        if (!phaserKey || !originalPath) {
             console.error(`[AssetLoader.preloadAsset] Invalid phaserKey or originalPath provided. Key: ${phaserKey}, Path: ${originalPath}`);
             return;
        }

        const hashedPath = this.getAssetPath(originalPath);
        if (!hashedPath) {
            // Warning already logged by getAssetPath
            console.error(`[AssetLoader.preloadAsset] Could not find hashed path for original path '${originalPath}'. Cannot preload asset with key '${phaserKey}'.`);
            return;
        }

        // Check if already loaded/queued based on asset type
        let alreadyLoaded = false;
        try {
            switch (assetType) {
                case 'image':
                    alreadyLoaded = this.textures.exists(phaserKey);
                    break;
                case 'audio':
                    // Check audio cache. Phaser might handle duplicates gracefully,
                    // but checking prevents redundant load calls and potential warnings.
                    alreadyLoaded = this.audioCache.exists(phaserKey);
                    break;
                case 'spritesheet':
                    // Spritesheets also result in textures
                    alreadyLoaded = this.textures.exists(phaserKey);
                    break;
                // Add other types (atlas, tilemap, bitmapFont, etc.)
                // case 'atlas':
                //     alreadyLoaded = this.textures.exists(phaserKey);
                //     break;
                default:
                    console.warn(`[AssetLoader.preloadAsset] Unknown assetType '${assetType}' for key '${phaserKey}'. Cannot check if loaded.`);
                    // Decide whether to attempt loading anyway or return. Returning is safer.
                    return;
            }
        } catch (error) {
             console.error(`[AssetLoader.preloadAsset] Error checking cache for Key='${phaserKey}', Type='${assetType}':`, error);
             // Avoid loading if cache check failed
             return;
        }


        if (!alreadyLoaded) {
            console.log(`[AssetLoader.preloadAsset] Queuing load: Key='${phaserKey}', Type='${assetType}', HashedPath='${hashedPath}'`);
            try {
                // Call the appropriate Phaser loader method
                switch (assetType) {
                    case 'image':
                        this.loader.image(phaserKey, hashedPath);
                        break;
                    case 'audio':
                        console.log(`[AssetLoader.preloadAsset] Calling this.loader.audio('${phaserKey}', '${hashedPath}')`);
                        this.loader.audio(phaserKey, hashedPath);

                        // Add event listeners for this specific file
                        this.loader.once(`filecomplete-audio-${phaserKey}`, (key, type, data) => {
                            console.log(`[AssetLoader.preloadAsset] SUCCESS: Audio file loaded and cached: Key='${key}'`);
                            // You can also inspect 'data' here if needed, it's usually the HTMLAudioElement or WebAudio buffer
                            if (this.audioCache.exists(key)) {
                                console.log(`[AssetLoader.preloadAsset] Confirmed: Key='${key}' exists in scene.cache.audio.`);
                            } else {
                                console.warn(`[AssetLoader.preloadAsset] WARNING: Key='${key}' DOES NOT exist in scene.cache.audio immediately after load event.`);
                            }
                        });
                        this.loader.once(`loaderror-audio-${phaserKey}`, (file) => {
                            console.error(`[AssetLoader.preloadAsset] ERROR loading audio file: Key='${file.key}', URL='${file.url}', ErrorType='${file.xhrLoader?.statusText || 'Unknown'}'`, file);
                        });
                        break;
                    case 'spritesheet':
                        if (!config || typeof config.frameWidth !== 'number' || typeof config.frameHeight !== 'number') {
                            console.error(`[AssetLoader.preloadAsset] Spritesheet '${phaserKey}' requires config object with numeric frameWidth and frameHeight.`);
                        } else {
                            // Pass frame dimensions and any other relevant config (margin, spacing)
                            this.loader.spritesheet(phaserKey, hashedPath, config);
                        }
                        break;
                    // Add other loader types
                    // case 'atlas':
                    //     // Atlas requires the atlas JSON path *and* the texture path
                    //     // This method might need adjustment if loading atlases often
                    //     // For now, assume config contains the path to the atlas JSON data if needed
                    //     // or that the primary path IS the JSON path. Check Phaser docs.
                    //     // Example: this.loader.atlas(phaserKey, hashedTexturePath, hashedAtlasJSONPath);
                    //     console.error(`[AssetLoader.preloadAsset] Atlas loading needs specific implementation.`);
                    //     break;
                    default:
                        // This case should ideally not be reached due to the check above
                        console.error(`[AssetLoader.preloadAsset] Loader not implemented for assetType '${assetType}' for key '${phaserKey}'.`);
                        break;
                }
            } catch (error) {
                 console.error(`[AssetLoader.preloadAsset] Error during Phaser loader call for Key='${phaserKey}', Type='${assetType}', HashedPath='${hashedPath}':`, error);
            }
        } else {
             // console.log(`[AssetLoader.preloadAsset] Asset already loaded/queued: Key='${phaserKey}', Type='${assetType}'`);
        }
    }
}

export default AssetLoader;
