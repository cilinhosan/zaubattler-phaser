// src/BattleScene.js
import Phaser from "phaser";
import battlesData from './game/battles.json';
import CharacterBattleDisplay from './game/CharacterBattleDisplay';
import GameDataManager from './game/GameDataManager.js';
// BattleCharacter is already imported, ensure it's the updated version
// import BattleCharacter from './game/BattleCharacter.js';
import { getCharacterDefinition } from './CharacterDefinitionList.js';
import AssetLoader from './AssetLoader.js';
import BattleLog from './game/BattleLog.js'; // Import the new BattleLog class
import menuBackground4 from '../assets/menu_background_illustration_4.jpg';

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
        this.battleLog = null; // To hold the BattleLog instance
    }

    preload() {
        // ... (preload logic remains largely the same, using the version from context)
        this.load.image('menuBg4', menuBackground4);
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
        // Ensure a black background during create, in case preload was instant
        this.cameras.main.setBackgroundColor('#000000');

        const gameWidth = this.sys.game.config.width;
        const gameHeight = this.sys.game.config.height;

        // Add a full-screen black overlay
        this.preparingOverlay = this.add.rectangle(0, 0, gameWidth, gameHeight, 0x000000, 1) // Solid black
            .setOrigin(0,0)
            .setDepth(9998); // High depth, but below text

        // Temporary "Preparing Battle..." text
        this.preparingText = this.add.text( // Store on this for access in _onBattleLogReady
            gameWidth / 2,
            gameHeight / 2,
            'Preparing Battle...',
            { fontSize: '30px', fill: '#ffffff', align: 'center' }
        ).setOrigin(0.5).setDepth(9999); // Higher depth to be on top of overlay


        // --- All existing setup code ---

        // Set background image (will cover the black background)
        let bg = this.add.image(0, 0, 'menuBg4').setOrigin(0, 0);
        let scaleX = gameWidth / bg.width;
        let scaleY = gameHeight / bg.height; // Use gameHeight for scaling
        let scale = Math.max(scaleX, scaleY);
        bg.setScale(scale).setScrollFactor(0);

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

        this.turnText = this.add.text(gameWidth / 2, 80, `Turn: ${this.turnCounter + 1}`, { fontSize: '100px', fill: '#fff' }).setOrigin(0.5);

        this.battleLog = new BattleLog(this); // Create an instance of BattleLog

        this.setupBackgroundMusic();

        // Perform initial BattleLog display. It will emit 'battleLogReady' when done.
        if (this.battleLog && this.battleLog.events) {
            console.log("BattleScene: Setting up 'battleLogReady' event listener."); // Roo: Added log
            this.battleLog.events.once('battleLogReady', this._onBattleLogReady, this);
            console.log("BattleScene: Scheduling battleLog.triggerInitialDisplay() via delayedCall."); // Roo: Updated log
            // Roo: Delay the initial display call to ensure BattleScene is fully active.
            this.time.delayedCall(0, () => {
                if (this.battleLog) { // Check if battleLog still exists (scene might have been destroyed)
                    console.log("BattleScene: Executing delayed battleLog.triggerInitialDisplay()."); // Roo: Added log
                    this.battleLog.triggerInitialDisplay(); // This triggers _performUpdateDisplay which emits the event
                } else {
                    console.warn("BattleScene: BattleLog instance was null when delayed triggerInitialDisplay was called.");
                }
            }, [], this);
        } else {
            console.error("BattleScene: BattleLog or its event emitter is not available. Cannot wait for battleLogReady.");
            // Fallback: If BattleLog or events are missing, proceed with a slight delay to avoid immediate issues.
            // This indicates a deeper problem if reached.
            this.time.delayedCall(100, this._onBattleLogReadyDirect, [], this);
        }
        
        // _initiateBattleStartSequence() is now called from _onBattleLogReady or _onBattleLogReadyDirect
    }

    _onBattleLogReady() {
        console.log("BattleScene: _onBattleLogReady event handler triggered."); // Roo: Added log
        if (this.preparingText && this.preparingText.active) {
            this.preparingText.destroy();
            this.preparingText = null;
        }
        if (this.preparingOverlay && this.preparingOverlay.active) {
            this.preparingOverlay.destroy();
            this.preparingOverlay = null;
        }
        this._initiateBattleStartSequence();
    }
    
    // Fallback if event system fails for some reason
    _onBattleLogReadyDirect() {
        console.warn("BattleScene: Proceeding via _onBattleLogReadyDirect (fallback). THIS IS UNEXPECTED if battleLog event system is working."); // Roo: Enhanced log
        if (this.preparingText && this.preparingText.active) {
            this.preparingText.destroy();
            this.preparingText = null;
        }
        if (this.preparingOverlay && this.preparingOverlay.active) {
            this.preparingOverlay.destroy();
            this.preparingOverlay = null;
        }
        this._initiateBattleStartSequence();
    }

    _initiateBattleStartSequence() {
        // This is where the 1-second visible pause happens
        this.time.delayedCall(1000, this.startTurn, [], this);
    }

    // Centralized method to add log messages
    addBattleLogMessage(message) {
        if (this.battleLog) {
            this.battleLog.addMessage(message);
        }
        // Keep console.log for developer/debugging purposes if desired
        // console.log(message);
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
            const turnStartMessage = `--- Starting Global Turn ${this.turnCounter} ---`;
            console.log(`\n${turnStartMessage}`); // Keep console log for dev
            this.addBattleLogMessage(turnStartMessage);

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

        const actionPhaseMessage = `Action Phase: ${this.currentActiveCharacter.name} (Turn ${this.turnCounter})`;
        console.log(`--- ${actionPhaseMessage} ---`); // Keep console log
        this.addBattleLogMessage(actionPhaseMessage);

        if (this.currentActiveCharacter.display) {
            this.currentActiveCharacter.display.highlightBorder(0x00ff00);
        }

        this.currentActiveCharacter.onActionPhaseStart(this.turnCounter);

        if (this.currentActiveCharacter.isDefeatedStatus()) {
            const defeatedMsg = `${this.currentActiveCharacter.name} was defeated by effects at start of their action phase.`;
            console.log(defeatedMsg); // Keep console log
            this.addBattleLogMessage(defeatedMsg);
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
            if (chosenAction.name === "Pass") {
                const passMsg = `${this.currentActiveCharacter.name} is passing the turn.`;
                console.log(passMsg); // Keep console log
                this.addBattleLogMessage(passMsg);
            } else {
                // Log skill usage, but the actual outcome/damage will be logged by the skill/sub-actions
                this.addBattleLogMessage(`${this.currentActiveCharacter.name} prepares ${chosenAction.name}.`);
            }
        }

        this.time.delayedCall(800, () => {
            if (!this.currentActiveCharacter || this.currentActiveCharacter.isDefeatedStatus()) {
                const defeatedMsg = `${this.currentActiveCharacter?.name || 'Character'} was defeated before acting.`;
                console.log(defeatedMsg); // Keep console log
                this.addBattleLogMessage(defeatedMsg);
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
                    let finalTargetsForExecute;

                    if (chosenAction.name === "Basic Attack") {
                        if (currentActionTargetTeam.length > 0) {
                            const randomTarget = currentActionTargetTeam[Math.floor(Math.random() * currentActionTargetTeam.length)];
                            finalTargetsForExecute = [randomTarget]; // Pass as an array with one target
                        } else {
                            finalTargetsForExecute = []; // No targets for basic attack
                        }
                    } else {
                        // For specific skills, pass the whole relevant team for the skill to process
                        finalTargetsForExecute = currentActionTargetTeam;
                    }

                    // chosenAction.execute now returns an array of sub-action functions
                    const subActions = chosenAction.execute(this, finalTargetsForExecute, currentActionCasterTeam);

                    if (Array.isArray(subActions) && subActions.length > 0) {
                        // Developer log for sub-action count
                        console.log(`Processing ${subActions.length} sub-actions for ${chosenAction.name} by ${this.currentActiveCharacter.name}`);
                        // Player-facing log for what the character is doing is handled before this,
                        // and specific outcomes are logged by sub-actions themselves.
                        // Call the new method to process the queue
                        this.processSubActionQueue(subActions, this.currentActiveCharacter, () => {
                            // This callback is executed after all sub-actions are done
                            this.refreshActiveCharactersList(); // Refresh once after all sub-actions
                            if (this.checkBattleEndConditions()) return;

                            if (this.currentActiveCharacter && !this.currentActiveCharacter.isDefeatedStatus()) {
                                // Call onActionPhaseEnd for the character
                                this.currentActiveCharacter.onActionPhaseEnd(this.turnCounter);

                                // Call afterAction hooks for the character's effects
                                const casterContext = this.currentActiveCharacter.getEffectContext();
                                for (const effect of this.currentActiveCharacter.attachedEffects) {
                                    if (effect.isActive && typeof effect.afterAction === 'function') {
                                        // Pass the original target team for the action, if needed by hooks
                                        effect.afterAction(casterContext, this.currentActiveCharacter, currentActionTargetTeam);
                                    }
                                }
                            }
                             if (this.currentActiveCharacter && this.currentActiveCharacter.isDefeatedStatus()) {
                                const defeatedMsg = `${this.currentActiveCharacter.name} was defeated by effects at end of their action phase (after sub-actions).`;
                                console.log(defeatedMsg); // Keep console log
                                this.addBattleLogMessage(defeatedMsg);
                            }
                            this.advanceToActionPhase();
                        });
                    } else if (Array.isArray(subActions) && subActions.length === 0) {
                        // Skill or action resulted in no sub-actions (e.g., Pass, or skill with no valid targets)
                        const noSubActionMsg = `${chosenAction.name} by ${this.currentActiveCharacter.name} resulted in no sub-actions.`;
                        console.log(noSubActionMsg); // Keep console log
                        // This might be redundant if "Pass" is already logged, or if skill failure is logged by skill.
                        // Consider if this specific message is needed for players.
                        // this.addBattleLogMessage(noSubActionMsg);
                        this.refreshActiveCharactersList(); // Still refresh in case of state changes before sub-actions
                         if (this.checkBattleEndConditions()) return;
                        // Directly proceed to end of action phase for this character
                        if (this.currentActiveCharacter && !this.currentActiveCharacter.isDefeatedStatus()) {
                            this.currentActiveCharacter.onActionPhaseEnd(this.turnCounter);
                             // afterAction hooks (though likely none for a "pass" type action)
                            const casterContext = this.currentActiveCharacter.getEffectContext();
                            for (const effect of this.currentActiveCharacter.attachedEffects) {
                                if (effect.isActive && typeof effect.afterAction === 'function') {
                                    effect.afterAction(casterContext, this.currentActiveCharacter, currentActionTargetTeam);
                                }
                            }
                        }
                        this.advanceToActionPhase();
                    } else {
                         const errorMsg = `${this.currentActiveCharacter.name} action ${chosenAction.name} did not return a valid sub-action array.`;
                         console.error(errorMsg); // Keep console error
                         this.addBattleLogMessage(`Error with ${this.currentActiveCharacter.name}'s action: ${chosenAction.name}.`);
                         this.advanceToActionPhase(); // Failsafe
                    }
                } else { // No valid targets for the chosen action initially
                    const noValidTargetsMsg = `${this.currentActiveCharacter.name} determined action ${chosenAction.name}, but no valid targets remain.`;
                    console.log(noValidTargetsMsg); // Keep console log
                    this.addBattleLogMessage(noValidTargetsMsg);
                    // Similar to empty sub-actions, end phase for this character
                    this.refreshActiveCharactersList();
                    if (this.checkBattleEndConditions()) return;
                    if (this.currentActiveCharacter && !this.currentActiveCharacter.isDefeatedStatus()) {
                        this.currentActiveCharacter.onActionPhaseEnd(this.turnCounter);
                        // afterAction hooks
                        const casterContext = this.currentActiveCharacter.getEffectContext();
                        for (const effect of this.currentActiveCharacter.attachedEffects) {
                            if (effect.isActive && typeof effect.afterAction === 'function') {
                                effect.afterAction(casterContext, this.currentActiveCharacter, currentActionTargetTeam);
                            }
                        }
                    }
                    this.advanceToActionPhase();
                }
            } else { // No chosenAction or execute method
                const actionFailedMsg = `${this.currentActiveCharacter.name} failed to determine a valid action or action has no execute method.`;
                console.error(actionFailedMsg); // Keep console error
                this.addBattleLogMessage(`${this.currentActiveCharacter.name}'s action failed.`);
                this.refreshActiveCharactersList();
                if (this.checkBattleEndConditions()) return;
                // End phase for this character
                if (this.currentActiveCharacter && !this.currentActiveCharacter.isDefeatedStatus()) {
                    this.currentActiveCharacter.onActionPhaseEnd(this.turnCounter);
                }
                this.advanceToActionPhase();
            }
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
    
        processSubActionQueue(subActionsArray, actingCharacter, onAllSubActionsCompleteCallback) {
            const SUB_ACTION_DELAY = 600; // ms between sub-actions, adjust as needed
    
            if (this.isBattleOver) {
                // Message already logged by endBattle or checkBattleEndConditions
                // console.log("Battle ended during sub-action sequence. Halting further sub-actions.");
                if (typeof onAllSubActionsCompleteCallback === 'function') {
                    onAllSubActionsCompleteCallback();
                }
                return;
            }
    
            if (!subActionsArray || subActionsArray.length === 0) {
                // No more sub-actions, execute the final callback
                if (typeof onAllSubActionsCompleteCallback === 'function') {
                    onAllSubActionsCompleteCallback();
                }
                return;
            }
    
            const subAction = subActionsArray.shift(); // Get the next sub-action
    
            this.time.delayedCall(SUB_ACTION_DELAY, () => {
                if (this.isBattleOver) { // Check again before executing sub-action
                    // console.log("Battle ended just before executing a sub-action. Halting.");
                     if (typeof onAllSubActionsCompleteCallback === 'function') {
                        onAllSubActionsCompleteCallback();
                    }
                    return;
                }
                // It's important to check the acting character's status *before* executing their sub-action.
                // If the character was defeated by a previous sub-action or a lingering effect triggered by it.
                if (actingCharacter.isDefeatedStatus()) {
                    // Defeat message should have been logged by onCharacterActuallyDefeated or similar
                    // console.log(`${actingCharacter.name} was defeated before a sub-action could execute. Skipping remaining sub-actions for this turn.`);
                     if (typeof onAllSubActionsCompleteCallback === 'function') {
                        onAllSubActionsCompleteCallback();
                    }
                    return;
                }
    
                if (typeof subAction === 'function') {
                    // Developer log for execution, player-facing logs come from subAction itself
                    // console.log(`Executing sub-action for ${actingCharacter.name}`);
                    subAction(); // Execute the current sub-action
                } else {
                    const errorMsg = "Encountered an invalid item in subActionsArray. Expected a function.";
                    console.error(errorMsg, subAction); // Keep console error
                    this.addBattleLogMessage("Error during action sequence.");
                }
    
                this.refreshActiveCharactersList(); // Refresh list and visuals after each sub-action
    
                // Check battle end *after* refreshing the list, as the sub-action might have caused defeat.
                if (this.checkBattleEndConditions()) {
                    // Battle ended due to this sub-action. The endBattle sequence should handle everything.
                    // The onAllSubActionsCompleteCallback might not be strictly necessary if endBattle cleans up,
                    // but calling it ensures the original flow that leads to advanceToActionPhase is completed,
                    // which itself checks isBattleOver.
                    // However, if endBattle truly finalizes, further advancement is moot.
                    // For now, let's assume checkBattleEndConditions, if true, means endBattle was called and took over.
                    return;
                }
    
                // Process the next sub-action in the queue
                this.processSubActionQueue(subActionsArray, actingCharacter, onAllSubActionsCompleteCallback);
    
            }, [], this);
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
        const defeatMsg = `${defeatedCharacter.name} has been defeated!`;
        console.log(`BattleScene: ${defeatMsg} Triggering hooks.`); // Keep console log
        this.addBattleLogMessage(defeatMsg);
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
        const endTurnMsg = `--- End of Global Turn ${globalTurnNumber} ---`;
        console.log(endTurnMsg); // Keep console log
        this.addBattleLogMessage(endTurnMsg);
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
        const battleOverMsg = "Battle Over!";
        console.log(battleOverMsg); // Keep console log
        this.addBattleLogMessage(battleOverMsg);

        // Ensure final global turn end hooks are called if a battle ends abruptly
        if (this.turnCounter > 0) { // Check if at least one turn started
            this.triggerGlobalTurnEndHooks(this.turnCounter);
        }


        const allPlayerDefeated = this.playerTeam.every(char => char.isDefeatedStatus());
        let outcome = allPlayerDefeated ? 'lose' : 'win';
        this.addBattleLogMessage(allPlayerDefeated ? "Player team defeated." : "Enemy team defeated!");

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

    // Make sure to destroy the battle log when the scene is shut down
    shutdown() {
        if (this.battleLog) {
            this.battleLog.destroy();
            this.battleLog = null;
        }
        // Any other cleanup specific to BattleScene
    }
}

export default BattleScene;