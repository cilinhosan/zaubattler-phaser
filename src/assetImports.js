// src/assetImports.js
// This file exists solely to ensure Webpack processes these assets
// and includes them in the build output and the asset manifest.
// It should be imported once in the main application entry point (e.g., index.js).

console.log('[Asset Imports] Processing assets for Webpack...');

// Default Player Icons
import defaultFaceIcon from '../assets/default_character_ilustration_face_icon.png';
import defaultBattleIcon from '../assets/default_character_ilustration_4_3.png';
import defaultLandscapeIllustration from '../assets/default_character_illustration_landscape.jpg';

// Default Enemy Icons (Note the two different defaults found)
import defaultEnemyFaceIcon from '../assets/default_enemy_illustration_face_icon.png'; // Used by PreBattleSetupScene preload
import defaultEnemyBattleIcon from '../assets/default_enemy_illustration_4_3.png'; // Used by non-player definitions

// Specific Character Icons (Add all specific character assets here)
import elzetteFaceIcon from '../assets/elzette_illustration_face_icon.png';
import elzetteBattleIcon from '../assets/elzette_illustration_4_3.png';
import elzetteLandscapeIllustration from '../assets/elzette_illustration_landscape.jpg';
import elzetteProfileIllustration from '../assets/elzette_illustration_profile.png';

// Add imports for other specific character assets if they exist (e.g., Katherine, Orc, etc.)
// Example:
// import katherineFaceIcon from '../assets/katherine_face.png';
// import katherineBattleIcon from '../assets/katherine_battle.png';

// Menu Background Illustrations
import menuBackground1 from '../assets/menu_background_illustration_1.jpg';
import menuBackground2 from '../assets/menu_background_illustration_2.jpg';
import menuBackground3 from '../assets/menu_background_illustration_3.jpg';
import menuBackground4 from '../assets/menu_background_illustration_4.jpg';
import menuBackground5 from '../assets/menu_background_illustration_5.jpg';
import menuBackground6 from '../assets/menu_background_illustration_6.jpg';
import menuBackground7 from '../assets/menu_background_illustration_7.jpg';
// UI Icons
import fullscreenIcon from '../assets/fullscreen_icon.png';
import audioOnIcon from '../assets/ui_icon_audio_on.png';
import audioOffIcon from '../assets/ui_icon_audio_off.png';

// Audio Assets
import audioBattleTheme1 from '../assets/audio_battle_theme_1.wav';
import audioMenuTheme1 from '../assets/audio_ui_menu_background_music_1.wav';
import audioMenuTheme2 from '../assets/audio_ui_menu_background_music_2.wav';

// Log imported paths (optional, for debugging build process)
// The variables hold the final hashed paths at runtime, but are useful here
// to confirm Webpack is resolving them during the build.
console.log('[Asset Imports] Imported paths (variables hold hashed paths at runtime):', {
    defaultFaceIcon,
    defaultBattleIcon,
    defaultEnemyFaceIcon,
    defaultEnemyBattleIcon,
    elzetteFaceIcon,
    elzetteBattleIcon,
    defaultLandscapeIllustration,
    elzetteLandscapeIllustration,
    elzetteProfileIllustration,
    audioBattleTheme1,
    audioMenuTheme1,
    audioMenuTheme2,
    audioOnIcon,
    audioOffIcon
});

// No need to export anything.