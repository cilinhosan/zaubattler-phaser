// src/BattleScene.js
import Phaser from "phaser";
import battlesData from './game/battles.json';
import CharacterBattleDisplay from './game/CharacterBattleDisplay';
import GameDataManager from './game/GameDataManager.js';
// BattleCharacter is already imported, ensure it's the updated version
// import BattleCharacter from './game/BattleCharacter.js';
import { getCharacterDefinition } from './CharacterDefinitionList.js';
import AssetLoader from './AssetLoader.js';

const MAX_SLOTS = 5;

class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
        this.playerTeam = [];
        this.enemyTeam = [];
        this.characters = []; // Unified array of characters currently active in battle (living)
        this.allBattleCharacters = []; // Array of all characters initially in battle (including defeated)
        this.activeCharacterIndex = 0;
        this.currentActiveCharacter = null;
        this.turnCounter = 0; // This IS the global turn/round counter
        this.isBattleOver = false;
    }

    preload() {
        // ... (preload logic remains largely the same, using the version from context)
        console.log("BattleScene: Preloading assets for current battle...");
        const manifest = this.registry.get('assetManifest');

        if (!manifest) {
            console.error('BattleScene: Asset Manifest not found in registry!');
            this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2,
                'Error: Asset Manifest missing!',
                { fill: '#ff0000', fontSize: '24px' }
            ).setOrigin(0.5);
            return;
        }

        const assetLoader = new AssetLoader(this);
        if (!assetLoader.manifest) {
            console.error("BattleScene: AssetLoader could not initialize (manifest missing). Stopping preload.");
            return;
        }

        const playerTeamDefinitions = GameDataManager.getCurrentBattlePlayerTeam();
        const enemyTeamDefinitions = GameDataManager.getCurrentBattleEnemyTeam();

        const uniqueDefinitionIds = new Set();
        playerTeamDefinitions.forEach(char => char?.definitionId && uniqueDefinitionIds.add(char.definitionId));
        enemyTeamDefinitions.forEach(char => char?.definitionId && uniqueDefinitionIds.add(char.definitionId));

        uniqueDefinitionIds.forEach(definitionId => {
            const definition = getCharacterDefinition(definitionId);
            if (!definition) {
                console.warn(`BattleScene: Could not find definition for ID '${definitionId}' while preloading assets.`);
                return;
            }
            if (definition.battleIconPath && definition.battleIconKey) {
                assetLoader.preloadAsset(definition.battleIconKey, definition.battleIconPath, 'image');
            } else {
                console.warn(`BattleScene: Definition '${definitionId}' missing battleIconPath or battleIconKey.`);
            }
        });
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a1a');

        this.playerTeam = GameDataManager.getCurrentBattlePlayerTeam();
        this.enemyTeam = GameDataManager.getCurrentBattleEnemyTeam();
        this.battleIndex = GameDataManager.getCurrentBattleIndex();

        if (!this.playerTeam || this.playerTeam.length === 0 || !this.enemyTeam || this.enemyTeam.length === 0) {
            console.error("BattleScene Error: Player or Enemy team not found or empty!");
            this.scene.start('MenuScreenScene');
            return;
        }

        this.allBattleCharacters = [...this.playerTeam, ...this.enemyTeam];

        this.allBattleCharacters.forEach(char => {
            if (char && typeof char.setBattleSceneContext === 'function') {
                char.setBattleSceneContext(this);
            } else {
                console.error("Character missing setBattleSceneContext method:", char);
            }
        });

        this.characters = this.allBattleCharacters.filter(char => !char.isDefeatedStatus());

        this.characterDisplays = [];
        for (const char of this.allBattleCharacters) {
            const teamIndex = char.team === 'player' ? this.playerTeam.indexOf(char) : this.enemyTeam.indexOf(char);
            const teamSize = char.team === 'player' ? this.playerTeam.length : this.enemyTeam.length;
            const display = new CharacterBattleDisplay(this, char, char.team, teamIndex, teamSize);
            char.display = display;
            if (char.isDefeatedStatus()) {
                display.hide();
            }
            this.characterDisplays.push(display);
        }

        this.isBattleOver = false;
        this.turnCounter = 0;
        this.activeCharacterIndex = 0;
        this.currentActiveCharacter = null;

        this.turnText = this.add.text(this.cameras.main.width / 2, 80, `Turn: ${this.turnCounter + 1}`, { fontSize: '100px', fill: '#fff' }).setOrigin(0.5);

        this.setupBackgroundMusic();
        this.time.delayedCall(1000, this.startTurn, [], this);
    }

    setupBackgroundMusic() {
        const musicKey = 'battle_music_loop';
        // console.log(`BattleScene: Checking for background music ('${musicKey}')...`);
    }

    startTurn() {
        if (this.isBattleOver) return;
        if (this.checkBattleEndConditions()) return;

        if (this.characters.length === 0 && this.allBattleCharacters.some(c => !c.isDefeatedStatus())) {
             console.warn("this.characters is empty, but not all characters are defeated. Attempting to refresh active characters.");
             this.refreshActiveCharactersList(); // Ensure this.characters is up-to-date
             if (this.characters.length === 0) {
                console.error("No active characters left after refresh, but battle not ended. Forcing end.");
                this.endBattle();
                return;
             }
        } else if (this.characters.length === 0) {
            console.error("No active characters left, but battle not ended. Forcing end.");
            this.endBattle();
            return;
        }

        // --- GLOBAL TURN START LOGIC ---
        if (this.activeCharacterIndex === 0 || this.activeCharacterIndex >= this.characters.length) {
            // This condition means it's the start of a new global turn cycle
            // OR the activeCharacterIndex has become invalid (e.g. >= this.characters.length)
            // due to defeats in the previous turn cycle.
            this.activeCharacterIndex = 0; // Reset for the new global turn

            if (this.turnCounter > 0) {
                this.triggerGlobalTurnEndHooks(this.turnCounter);
            }
            this.turnCounter++;
            this.turnText.setText(`Turn: ${this.turnCounter}`);
            console.log(`\n--- Starting Global Turn ${this.turnCounter} ---`);

            // Process start-of-global-turn effects for ALL living characters
            // Iterate over a copy in case the array is modified by effects
            const charactersAtTurnStart = [...this.characters];
            for (const char of charactersAtTurnStart) {
                if (!char.isDefeatedStatus()) {
                    char.processGlobalTurnStart(this.turnCounter);
                }
            }

            this.refreshActiveCharactersList(); // Update this.characters and visuals
            if (this.checkBattleEndConditions()) return;
            if (this.characters.length === 0) {
                this.endBattle();
                return;
            }
        }
        // --- END GLOBAL TURN START LOGIC ---

        // Ensure activeCharacterIndex is valid for the (potentially updated) this.characters list
        this.activeCharacterIndex = this.activeCharacterIndex % this.characters.length;
        this.currentActiveCharacter = this.characters[this.activeCharacterIndex];

        if (!this.currentActiveCharacter || this.currentActiveCharacter.isDefeatedStatus()) {
            console.warn(`Attempting to start action phase for invalid/defeated character. Index: ${this.activeCharacterIndex}, Name: ${this.currentActiveCharacter?.name}. Advancing.`);
            this.advanceToActionPhase(); // This will increment activeCharacterIndex and recall startTurn
            return;
        }

        console.log(`--- Action Phase: ${this.currentActiveCharacter.name} (Turn ${this.turnCounter}) ---`);

        if (this.currentActiveCharacter.display) {
            this.currentActiveCharacter.display.highlightBorder(0x00ff00);
        }

        this.currentActiveCharacter.onActionPhaseStart(this.turnCounter);

        if (this.currentActiveCharacter.isDefeatedStatus()) {
            console.log(`${this.currentActiveCharacter.name} was defeated by effects at start of their action phase.`);
            this.refreshActiveCharactersList(); // Update list and visuals
            this.advanceToActionPhase();
            return;
        }

        const targetTeam = this.currentActiveCharacter.team === 'player'
            ? this.enemyTeam.filter(char => !char.isDefeatedStatus())
            : this.playerTeam.filter(char => !char.isDefeatedStatus());
        const casterTeam = this.currentActiveCharacter.team === 'player'
            ? this.playerTeam.filter(char => !char.isDefeatedStatus())
            : this.enemyTeam.filter(char => !char.isDefeatedStatus());

        const chosenAction = this.currentActiveCharacter.determineAction(targetTeam, casterTeam);

        if (chosenAction && this.currentActiveCharacter.display) {
            const highlightColor = chosenAction.name === "Basic Attack" ? 0xffa500 : (chosenAction.name === "Pass" ? null : 0x0000ff);
            this.currentActiveCharacter.display.highlightBorder(highlightColor);
            if (chosenAction.name === "Pass") console.log(`${this.currentActiveCharacter.name} is passing the turn.`);
        }

        this.time.delayedCall(800, () => {
            if (!this.currentActiveCharacter || this.currentActiveCharacter.isDefeatedStatus()) {
                console.log(`${this.currentActiveCharacter?.name || 'Character'} was defeated before acting.`);
                this.refreshActiveCharactersList();
                this.advanceToActionPhase();
                return;
            }

            if (chosenAction && typeof chosenAction.execute === 'function') {
                const currentLivingPlayerTeam = this.playerTeam.filter(char => !char.isDefeatedStatus());
                const currentLivingEnemyTeam = this.enemyTeam.filter(char => !char.isDefeatedStatus());
                const currentActionTargetTeam = this.currentActiveCharacter.team === 'player' ? currentLivingEnemyTeam : currentLivingPlayerTeam;
                const currentActionCasterTeam = this.currentActiveCharacter.team === 'player' ? currentLivingPlayerTeam : currentLivingEnemyTeam;

                let validTargetsForActionExist = true;
                if (chosenAction.targetType === 'enemy' || chosenAction.targetType === 'allEnemies') {
                    validTargetsForActionExist = currentActionTargetTeam.length > 0;
                } else if (chosenAction.targetType === 'ally' || chosenAction.targetType === 'allAllies') {
                    validTargetsForActionExist = currentActionCasterTeam.length > 0;
                }

                if (validTargetsForActionExist) {
                    console.log(`Executing action: ${chosenAction.name} for ${this.currentActiveCharacter.name}`);
                    chosenAction.execute(this, currentActionTargetTeam, currentActionCasterTeam);
                } else {
                    console.log(`${this.currentActiveCharacter.name} determined action ${chosenAction.name}, but no valid targets remain.`);
                }
            } else {
                console.error(`${this.currentActiveCharacter.name} failed to determine a valid action or action has no execute method.`);
            }

            this.refreshActiveCharactersList(); // Update list and visuals after action

            if (this.currentActiveCharacter && !this.currentActiveCharacter.isDefeatedStatus()) {
                this.currentActiveCharacter.onActionPhaseEnd(this.turnCounter);
            }

            if (this.currentActiveCharacter && this.currentActiveCharacter.isDefeatedStatus()) {
                console.log(`${this.currentActiveCharacter.name} was defeated by effects at end of their action phase.`);
                // refreshActiveCharactersList was already called
            }

            this.advanceToActionPhase();
        }, [], this);
    }

    refreshActiveCharactersList() {
        // This function solely updates the this.characters list and character visuals
        this.characters = this.allBattleCharacters.filter(char => !char.isDefeatedStatus());

        this.allBattleCharacters.forEach(char => {
            if (char.isDefeatedStatus() && char.display && !char.display.isDestroyed) {
                char.display.showDefeated();
            }
        });
        // It does NOT modify activeCharacterIndex.
    }


    advanceToActionPhase() {
        if (this.currentActiveCharacter && this.currentActiveCharacter.display && !this.currentActiveCharacter.display.isDestroyed) {
            this.currentActiveCharacter.display.clearHighlight();
        }

        this.activeCharacterIndex++; // Increment for the next character in this global turn

        if (this.checkBattleEndConditions()) {
            return;
        }
        // No need to call refreshActiveCharactersList here unless an action in advanceToActionPhase could cause defeat.
        // startTurn will handle refreshing the list at the beginning of a global turn cycle.
        this.time.delayedCall(800, this.startTurn, [], this);
    }

    checkBattleEndConditions() {
        const allPlayerDefeated = this.playerTeam.every(char => char.isDefeatedStatus());
        const allEnemyDefeated = this.enemyTeam.every(char => char.isDefeatedStatus());

        if (allPlayerDefeated || allEnemyDefeated) {
            if (!this.isBattleOver) this.endBattle();
            return true;
        }
        return false;
    }

    onCharacterActuallyDefeated(contextOfDefeatedChar, defeatedCharacter) {
        console.log(`BattleScene: ${defeatedCharacter.name} officially defeated. Triggering hooks.`);
        const livingCharacters = this.allBattleCharacters.filter(char => !char.isDefeatedStatus() && char !== defeatedCharacter);
        livingCharacters.forEach(char => {
            const charContext = char.getEffectContext();
            char.attachedEffects.forEach(effect => {
                if (effect.isActive && typeof effect.onCharacterDefeated === 'function') {
                    effect.onCharacterDefeated(charContext, defeatedCharacter);
                }
            });
        });
        this.refreshActiveCharactersList(); // Update list and visuals
        this.checkBattleEndConditions();
    }

    triggerGlobalTurnEndHooks(globalTurnNumber) {
        console.log(`--- End of Global Turn ${globalTurnNumber} ---`);
        this.allBattleCharacters.forEach(char => { // Iterate all, even if defeated, in case of "on death of ally" end of turn effects
            if (!char.isDefeatedStatus()) { // But only process for living characters
                 char.processGlobalTurnEnd(globalTurnNumber);
            }
        });
    }


    drawAttackIndicator(attackerDisplay, targetDisplay) {
        const line = this.add.graphics();
        line.lineStyle(2, 0xffff00, 1);
        const attackerCenterX = attackerDisplay.graphics.x + attackerDisplay.rectWidth / 2;
        const attackerCenterY = attackerDisplay.graphics.y + attackerDisplay.rectHeight / 2;
        const targetCenterX = targetDisplay.graphics.x + targetDisplay.rectWidth / 2;
        const targetCenterY = targetDisplay.graphics.y + targetDisplay.rectHeight / 2;
        line.lineBetween(attackerCenterX, attackerCenterY, targetCenterX, targetCenterY);
        return line;
    }

    endBattle() {
        if (this.isBattleOver) return;
        this.isBattleOver = true;
        console.log("Battle Over!");

        // Ensure final global turn end hooks are called if a battle ends abruptly
        if (this.turnCounter > 0) { // Check if at least one turn started
            this.triggerGlobalTurnEndHooks(this.turnCounter);
        }


        const allPlayerDefeated = this.playerTeam.every(char => char.isDefeatedStatus());
        let outcome = allPlayerDefeated ? 'lose' : 'win';

        GameDataManager.setLastBattleResult({ won: outcome === 'win' });

        if (outcome === 'win') {
            const nextBattleIndex = this.battleIndex + 1;
            if (nextBattleIndex < battlesData.length) {
                this.time.delayedCall(1500, () => {
                    this.playerTeam.forEach(char => char && typeof char.resetForBattle === 'function' && char.resetForBattle());
                    GameDataManager.incrementBattleIndex();
                    this.scene.switch('PreBattleSetupScene');
                }, [], this);
            } else {
                this.time.delayedCall(1500, () => {
                    this.playerTeam.forEach(char => char && typeof char.resetForBattle === 'function' && char.resetForBattle());
                    this.scene.start('EndGameScene', { outcome: 'win' });
                }, [], this);
            }
        } else {
            this.time.delayedCall(1500, () => {
                this.playerTeam.forEach(char => char && typeof char.resetForBattle === 'function' && char.resetForBattle());
                this.scene.start('EndGameScene', { outcome: 'lose' });
            }, [], this);
        }
    }

    update() {
        // Update logic if needed
    }
}

export default BattleScene;