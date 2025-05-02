import Phaser from 'phaser';

/**
 * Sets up a standard loading progress display (progress bar, percentage, asset text)
 * for a Phaser Scene during its preload phase.
 *
 * @param {Phaser.Scene} scene - The scene instance to add the indicator to.
 * @param {string} [loadingTitle='Loading...'] - The initial text to display above the progress bar.
 */
function setupLoadingIndicator(scene, loadingTitle = 'Loading...') {
    console.log(`[LoadingIndicator] Setting up for scene: ${scene.scene.key}`);
    scene.cameras.main.setBackgroundColor('#000000'); // Ensure black background

    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;

    // --- Create Graphics ---
    const progressBar = scene.add.graphics();
    const progressBox = scene.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = scene.make.text({
        x: width / 2,
        y: height / 2 - 50,
        text: loadingTitle, // Use the provided title
        style: { font: '20px monospace', fill: '#ffffff' }
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = scene.make.text({
        x: width / 2,
        y: height / 2,
        text: '0%',
        style: { font: '18px monospace', fill: '#ffffff' }
    });
    percentText.setOrigin(0.5, 0.5);

    // --- Setup Event Listeners ---
    // Update progress bar
    scene.load.on('progress', (value) => {
        // Check if percentText still exists (might be destroyed if scene changes quickly)
        if (percentText.active) {
            percentText.setText(parseInt(value * 100) + '%');
        }
        // Check if progressBar still exists
        if (progressBar.active) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        }
    });

    // Remove progress display when complete
    scene.load.on('complete', () => {
        // Check if graphics/text still exist before destroying
        if (progressBar.active) progressBar.destroy();
        if (progressBox.active) progressBox.destroy();
        if (loadingText.active) loadingText.destroy();
        if (percentText.active) percentText.destroy();
        console.log(`[LoadingIndicator] Load complete for scene: ${scene.scene.key}`);
        // Remove listeners to prevent memory leaks if the scene restarts/reloads
        // Check if scene.load still exists before removing listeners
        if (scene.load) {
            scene.load.off('progress');
            scene.load.off('fileprogress');
            scene.load.off('complete');
        }
    });

    // Note: Specific error handling (like manifest missing) should be done
    // in the scene's preload *before* calling this setup function,
    // or the loadingTitle can be updated by the scene if an error occurs later.
}

export default setupLoadingIndicator;
