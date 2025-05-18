// src/game/AudioManager.js

class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sound = scene.sound;
        this.currentMusic = null;
        this.lastMenuMusicKey = null;
        // Initialize mute state. Phaser's global mute is this.sound.mute (true/false)
        // We'll sync with this.sound.mute. Default to unmuted.
        if (this.sound.mute === undefined) { // Should not happen, but as a safeguard
            this.sound.mute = false;
        }
        // No need for a separate this.muted property if we directly use this.sound.mute

        this.menuMusicKeys = [
            'audio_menu_theme_1',
            'audio_menu_theme_2'
        ];
        this.battleMusicKey = 'audio_battle_theme_1';
    }

    _playMusic(key, config = { loop: true, volume: 0.5 }) {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.stop();
        }
        // Ensure the sound exists in the cache (was preloaded)
        // this.sound.get(key) is a shortcut for this.scene.sound.get(key)
        // which checks if a sound *instance* with that key exists.
        // For preloaded assets, we should check the cache directly.
        // this.scene.cache.audio is the scene-specific accessor to the global audio cache.
        
        const sceneCacheExists = this.scene.cache.audio.exists(key);
        const globalCacheExists = this.scene.sys.game.cache.audio.exists(key);

        if (sceneCacheExists) {
            this.currentMusic = this.sound.add(key, config);
            // play() will respect this.sound.mute automatically.
            // If muted, it "plays" but at 0 volume effectively.
            this.currentMusic.play();
        } else {
            console.warn(`[AudioManager] Audio key "${key}" not found in this.scene.cache.audio. Scene: ${this.scene.scene.key}. Preloaded?`);
            if (globalCacheExists) {
                console.warn(`[AudioManager] BUT, Audio key "${key}" WAS FOUND in game.cache.audio. Trying to play from global cache reference.`);
                // Attempt to add it via the global sound manager if scene-specific fails, though this is unusual.
                // this.scene.sys.game.sound.add(key, config) might be an option,
                // but typically this.sound.add should work if the asset is in the global cache.
                // The issue might be that this.sound (this.scene.sound) isn't "seeing" the globally cached item.
                // Let's try adding directly and see if Phaser resolves it.
                try {
                    this.currentMusic = this.sound.add(key, config); // Try again
                    this.currentMusic.play(); // Respects global mute
                    console.log(`[AudioManager] Successfully played "${key}" after re-attempting add.`);
                } catch (e) {
                    console.error(`[AudioManager] Error attempting to play "${key}" even after finding in global cache:`, e);
                }
            } else {
                console.error(`[AudioManager] Audio key "${key}" also NOT FOUND in game.cache.audio. Definitely not preloaded or load failed.`);
            }
        }
    }

    playMenuMusic(forceDifferent = false) {
        console.log(`[AudioManager.playMenuMusic] Called. forceDifferent: ${forceDifferent}, lastMenuMusicKey: ${this.lastMenuMusicKey}`);
        let availableMenuTracks = [...this.menuMusicKeys];
        console.log(`[AudioManager.playMenuMusic] Initial availableMenuTracks: [${availableMenuTracks.join(', ')}]`);

        if (forceDifferent && this.lastMenuMusicKey) {
            console.log(`[AudioManager.playMenuMusic] Applying 'forceDifferent'. Filtering out: ${this.lastMenuMusicKey}`);
            availableMenuTracks = availableMenuTracks.filter(key => key !== this.lastMenuMusicKey);
            console.log(`[AudioManager.playMenuMusic] Filtered availableMenuTracks: [${availableMenuTracks.join(', ')}]`);
        }

        if (availableMenuTracks.length === 0) {
            console.log(`[AudioManager.playMenuMusic] No tracks available after filtering. Resetting to full list.`);
            // Fallback if filtering removed all tracks (e.g., only one menu track and forceDifferent is true)
            availableMenuTracks = [...this.menuMusicKeys];
            console.log(`[AudioManager.playMenuMusic] Reset availableMenuTracks: [${availableMenuTracks.join(', ')}]`);
        }

        const randomIndex = Math.floor(Math.random() * availableMenuTracks.length);
        const selectedKey = availableMenuTracks[randomIndex];
        
        console.log(`[AudioManager.playMenuMusic] Chosen randomIndex: ${randomIndex}, selectedKey: ${selectedKey} from [${availableMenuTracks.join(', ')}]`);
        
        this._playMusic(selectedKey);
        this.lastMenuMusicKey = selectedKey; // Remember this for the next potential switch
        console.log(`[AudioManager.playMenuMusic] Playing menu music: ${selectedKey}. Updated lastMenuMusicKey to: ${this.lastMenuMusicKey}`);
    }

    playBattleMusic() {
        // lastMenuMusicKey is already set when menu music was playing
        this._playMusic(this.battleMusicKey);
        console.log(`[AudioManager] Playing battle music: ${this.battleMusicKey}`);
    }

    stopMusic() {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.stop();
            console.log('[AudioManager] Music stopped.');
        }
        this.currentMusic = null;
    }

    toggleMute() {
        const MUTE_STATE_BEFORE_METHOD_CALL = this.sound.mute;
        console.log(`[AudioManager.toggleMute] Mute state at method start: ${MUTE_STATE_BEFORE_METHOD_CALL}`);

        let newMuteState;
        if (MUTE_STATE_BEFORE_METHOD_CALL === true) {
            this.sound.mute = false;
            newMuteState = false; // This is the state we INTEND to set
            console.log(`[AudioManager.toggleMute] Intended to set this.sound.mute to false.`);
        } else {
            this.sound.mute = true;
            newMuteState = true; // This is the state we INTEND to set
            console.log(`[AudioManager.toggleMute] Intended to set this.sound.mute to true.`);
        }
        
        // Log what Phaser's getter reports immediately after setting
        const reportedMuteStateAfterAssignment = this.sound.mute;
        console.log(`[AudioManager.toggleMute] Mute state reported by this.sound.mute immediately after assignment: ${reportedMuteStateAfterAssignment}`);
        
        // For the return value and subsequent logic, trust the state we intended to set,
        // as the immediate read-back seems unreliable.
        console.log(`[AudioManager.toggleMute] Global mute toggled. Effective new state: ${newMuteState ? 'MUTED' : 'UNMUTED'}`);
        
        // If unmuting and there's current music that was "playing" silently,
        // it should become audible. If it was stopped, this won't restart it.
        // Phaser's sound objects handle their volume based on global mute.
        return newMuteState; // Return the INTENDED new state
    }

    isMuted() {
        return this.sound.mute;
    }

    // Call this when a scene shuts down to ensure music stops if not handled by the next scene
    onSceneShutdown() {
        // This is a bit broad. Ideally, scenes manage their own music start/stop.
        // However, as a safety, if music is playing and not explicitly stopped by
        // the scene transition logic, this can be a fallback.
        // For now, we'll let scenes explicitly call playMenuMusic or playBattleMusic.
        // this.stopMusic();
    }
}

export default AudioManager;