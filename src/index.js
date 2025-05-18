import Phaser from "phaser";
import './assetImports.js'; // Import for Webpack to process assets
import PreloaderScene from './PreloaderScene'; // Import the new PreloaderScene
import MenuScreenScene from './MenuScreenScene';
import BattleScene from './BattleScene';
import PreBattleSetupScene from './PreBattleSetupScene';
import EndGameScene from './EndGameScene'; // Import the new scene
import StartGameScene from './StartGameScene'; // Keep StartGameScene for now, might be removed later if unused
import MenuInstructionScene from './MenuInstructionScene'; // Import the renamed Instructions scene
import MenuAboutScene from './MenuAboutScene'; // Import the new About scene
import BattleRewardScene from './BattleRewardScene'; // Import the Battle Reward Scene
import { CharacterProfileScene } from './CharacterProfileScene';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        width: 1920,
        height: 1080,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    input: {
        debug: false
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    // PreloaderScene is now the first scene loaded
    scene: [PreloaderScene, StartGameScene, MenuScreenScene, MenuInstructionScene, MenuAboutScene, PreBattleSetupScene, BattleScene, BattleRewardScene, EndGameScene, CharacterProfileScene] // Add BattleRewardScene, MenuInstructionScene and MenuAboutScene
};
const game = new Phaser.Game(config);