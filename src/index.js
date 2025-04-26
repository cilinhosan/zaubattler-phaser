import Phaser from "phaser";
import MenuScreenScene from './MenuScreenScene';
import BattleScene from './BattleScene';
import PreBattleSetupScene from './PreBattleSetupScene';
import EndGameScene from './EndGameScene'; // Import the new scene
import StartGameScene from './StartGameScene'; // Import the new StartGameScene

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        width: 1920,
        height: 1080,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    input: { // <-- ADD THIS BLOCK
        debug: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    // StartGameScene is now the first scene loaded
    scene: [StartGameScene, MenuScreenScene, PreBattleSetupScene, BattleScene, EndGameScene]
};
const game = new Phaser.Game(config);