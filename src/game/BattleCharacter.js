// src/game/BattleCharacter.js
import BaseCharacter from './BaseCharacter.js';
import { getCharacterDefinition } from '../CharacterDefinitionList.js';
import * as SkillHelper from './SkillHelper.js';
// Import AttachedEffect if specific effect classes are instantiated here,
// otherwise, skills will create and pass them.

/**
 * Represents a character specifically within the context of a battle.
 * Handles combat stats, attached effects, skill execution, and taking actions.
 */
export class BattleCharacter extends BaseCharacter {
    constructor(definitionId, level = 1, team = 'player') {
        super(definitionId, level);

        this.definition = getCharacterDefinition(definitionId);
        if (!this.definition) {
            throw new Error(`Failed to get definition instance for ID "${definitionId}" in BattleCharacter`);
        }

        this.team = team;
        this.battleSceneContext = null; // Will be set by BattleScene

        this.maxHp = 0;
        this.currentHp = 0;
        this.currentAtk = 0;
        this.currentDef = 0;
        this.critChance = 0;
        this.critDamage = 0;
        this.calculateStatsFromLevel();

        this.isDefeated = false;
        this.attachedEffects = []; // Stores instances of AttachedEffect

        this.skillCooldowns = {};
        this.initializeSkillCooldowns();

        this.display = null;
    }

    setBattleSceneContext(scene) {
        this.battleSceneContext = scene;
        this.applyInitialPassiveEffects();
        this.currentHp = Math.min(this.currentHp, this.maxHp); 
    }

    getEffectContext() {
        let ownTeam = null;
        let enemyTeam = null;
        if (this.battleSceneContext && typeof this.battleSceneContext.getTeam === 'function') {
            // Assuming getTeam returns the array of BattleCharacter instances for that team
            ownTeam = this.battleSceneContext.getTeam(this.team);
            const enemyTeamName = this.team === 'player' ? 'enemy' : 'player'; // Simple toggle
            enemyTeam = this.battleSceneContext.getTeam(enemyTeamName);
        } else if (this.battleSceneContext) {
            // Fallback if getTeam is not a function, try direct properties if they exist (less robust)
            // console.warn("BattleCharacter.getEffectContext: battleSceneContext.getTeam is not a function. Trying direct properties.");
            // ownTeam = this.team === 'player' ? this.battleSceneContext.playerTeam : this.battleSceneContext.enemyTeam;
            // enemyTeam = this.team === 'player' ? this.battleSceneContext.enemyTeam : this.battleSceneContext.playerTeam;
        }
        
        return {
            scene: this.battleSceneContext,
            owner: this,
            ownTeam: ownTeam,
            enemyTeam: enemyTeam
        };
    }

    calculateStatsFromLevel() {
        const levelMultiplier = 1 + (this.level - 1) * 0.1;
        this.maxHp = Math.floor(this.baseStats.hp * levelMultiplier);
        this.currentAtk = Math.floor(this.baseStats.atk * levelMultiplier);
        this.currentDef = Math.floor(this.baseStats.def * levelMultiplier);
        this.critChance = this.baseStats.critChance;
        this.critDamage = this.baseStats.critDamage;
        this.currentHp = this.maxHp;
    }

    initializeSkillCooldowns() {
        this.skillCooldowns = {};
        const skillMethods = this.definition.getAllSkillMethods();
        skillMethods.forEach(methodName => {
            const metadata = this.definition.getSkillMetadata(methodName);
            if (metadata && metadata.type === 'active') {
                this.skillCooldowns[methodName] = 0;
            }
        });
    }

    addAttachedEffect(effectInstance) {
        if (!effectInstance || typeof effectInstance.onApply !== 'function') {
            console.error("Invalid effectInstance passed to addAttachedEffect", effectInstance);
            return;
        }
        const existingEffect = this.attachedEffects.find(e => e.type === effectInstance.type && e.sourceSkillId === effectInstance.sourceSkillId);
        if (existingEffect && typeof existingEffect.refreshDuration === 'function') { 
            existingEffect.refreshDuration(effectInstance.duration);
            if (typeof existingEffect.onApply === 'function') { 
                 existingEffect.onApply(this.getEffectContext());
            }
            console.log(`Effect ${effectInstance.type} on ${this.name} refreshed.`);
            return existingEffect;
        }

        this.attachedEffects.push(effectInstance);
        effectInstance.onApply(this.getEffectContext());
        console.log(`Effect ${effectInstance.type} applied to ${this.name}.`);
        return effectInstance;
    }

    removeAttachedEffectById(effectId) {
        const index = this.attachedEffects.findIndex(effect => effect.id === effectId);
        if (index > -1) {
            const effect = this.attachedEffects[index];
            effect.onExpire(this.getEffectContext()); 
            this.attachedEffects.splice(index, 1);
            console.log(`Effect ${effect.type} (ID: ${effect.id}) removed from ${this.name}.`);
        }
    }

    applyInitialPassiveEffects() {
        if (!this.battleSceneContext) {
            console.warn(`Cannot apply initial passive effects for ${this.name}: battleSceneContext not set.`);
            return;
        }
        const skillMethods = this.definition.getAllSkillMethods();
        skillMethods.forEach(methodName => {
            const metadata = this.definition.getSkillMetadata(methodName);
            if (metadata && metadata.type === 'passive' && (metadata.applyImmediately || metadata.modifiesStats)) {
                if (typeof this.definition[methodName] === 'function') {
                    console.log(`Executing passive skill method: ${metadata.name} for ${this.name}`);
                    this.definition[methodName](this, null, null, this.getEffectContext()); 
                } else {
                    console.warn(`Passive skill method ${methodName} not found on definition for ${this.name}`);
                }
            }
        });
    }

    takeDamage(initialAmount, source = null, damageType = 'physical', isCrit = false, options = {}) {
        if (this.isDefeated) return 0;

        let damageInfo = {
            baseAmount: initialAmount, 
            amount: initialAmount,     
            finalAmount: 0,            
            source: source,
            damageType: damageType,
            isCrit: isCrit,
            isThornsDamage: options.isThornsDamage || false, 
        };

        if (!damageInfo.isThornsDamage) { 
            for (const effect of this.attachedEffects) {
                if (effect.isActive && typeof effect.onDamageTaken === 'function') {
                    damageInfo = effect.onDamageTaken(this.getEffectContext(), damageInfo) || damageInfo;
                }
            }
        }

        const defenseReduction = this.currentDef; 
        let calculatedDamage = Math.max(1, damageInfo.amount - defenseReduction);

        damageInfo.finalAmount = Math.floor(calculatedDamage);
        this.currentHp -= damageInfo.finalAmount;
        this.currentHp = Math.max(0, this.currentHp);
        console.log(`${this.name} takes ${damageInfo.finalAmount} ${damageInfo.damageType} damage from ${source ? source.name : 'Unknown'}. HP: ${this.currentHp}/${this.maxHp}`);

        if (this.currentHp <= 0) {
            this.isDefeated = true;
            console.log(`${this.name} has been defeated!`);
            if (this.battleSceneContext && typeof this.battleSceneContext.onCharacterActuallyDefeated === 'function') {
                this.battleSceneContext.onCharacterActuallyDefeated(this.getEffectContext(), this);
            }
        }

        if (this.display) {
            this.display.updateHpDisplay(this.currentHp, this.maxHp);
            if (damageInfo.finalAmount > 0 && !this.isDefeated) this.display.shake();
            if (this.isDefeated) this.display.showDefeated();
        }

        return damageInfo.finalAmount;
    }

    heal(amount, source = null) { 
        if (this.isDefeated) return 0;
        const healAmount = Math.max(0, amount);
        this.currentHp += healAmount;
        this.currentHp = Math.min(this.currentHp, this.maxHp);
        console.log(`${this.name} heals for ${healAmount}. HP: ${this.currentHp}/${this.maxHp}`);
        if (this.display) {
            this.display.updateHpDisplay(this.currentHp, this.maxHp);
        }
        return healAmount;
    }

    getBasicAttackAction(targetTeam) {
        return {
            name: "Basic Attack",
            caster: this,
            targetType: 'enemy',
            execute: (battleScene, chosenTargets) => { // This outer 'execute' will now return an array of sub-actions
                const subActions = [];
                const basicAttackSubAction = () => { // This is the actual sub-action
                    // Ensure battleScene is valid when this sub-action executes
                    // It should be, as it's passed in from BattleScene's main loop.
                    if (!battleScene) {
                        console.error("Basic Attack sub-action: battleScene context is undefined!");
                        return;
                    }

                    const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
                    if (livingTargets.length === 0) {
                        console.log(`${this.name} tries Basic Attack, but no living targets.`);
                        return;
                    }
                    // Use chosenTargets if provided (e.g., by player input), otherwise random.
                    // Note: chosenTargets here is the `currentActionTargetTeam` from BattleScene.
                    // For a single-target basic attack, we'd typically pick one.
                    const target = chosenTargets && chosenTargets.length > 0 && !chosenTargets[0].isDefeatedStatus()
                                   ? chosenTargets[0]
                                   : livingTargets[Math.floor(Math.random() * livingTargets.length)];
                    
                    if (!target || target.isDefeatedStatus()) { // Final check on the selected target
                         console.log(`${this.name} tries Basic Attack, but the selected target ${target?.name || 'unknown'} is invalid or defeated.`);
                         return;
                    }

                    console.log(`${this.name} uses Basic Attack on ${target.name}`);

                    let baseDamage = this.currentAtk;
                    const isCrit = Math.random() < this.critChance;
                    if (isCrit) {
                        baseDamage = Math.floor(baseDamage * this.critDamage);
                    }
                    SkillHelper.dealDamage(this, target, baseDamage, 'physical', { isCrit }, battleScene);
                };
                subActions.push(basicAttackSubAction);
                return subActions;
            }
        };
    }

    determineAction(targetTeam, ownTeam) {
        if (this.isDefeated) return null;

        const context = this.getEffectContext();

        const skillMethods = this.definition.getAllSkillMethods();
        for (const methodName of skillMethods) {
            const metadata = this.definition.getSkillMetadata(methodName);
            if (metadata && metadata.type === 'active' && this.skillCooldowns[methodName] <= 0) {
                if (typeof this.definition[methodName] === 'function') {
                    const livingTargetTeam = targetTeam.filter(t => t && !t.isDefeatedStatus());
                    const livingOwnTeam = ownTeam.filter(t => t && !t.isDefeatedStatus());
                    let hasValidTargets = true; 
                     if ((metadata.targetType === 'enemy' || metadata.targetType === 'allEnemies') && livingTargetTeam.length === 0) hasValidTargets = false;
                     if ((metadata.targetType === 'ally' || metadata.targetType === 'allAllies') && livingOwnTeam.length === 0) hasValidTargets = false;

                    if (hasValidTargets) {
                        // console.log(`${this.name} considers using skill: ${metadata.name}`); // Less verbose
                        return {
                            name: metadata.name,
                            skillId: metadata.id || methodName, 
                            caster: this,
                            targetType: metadata.targetType || 'enemy',
                            execute: (battleScene, chosenTargetsFromScene) => { // This function now returns the array of sub-actions
                                // --- beforeAction hooks ---
                                for (const effect of this.attachedEffects) {
                                    if (effect.isActive && typeof effect.beforeAction === 'function') {
                                        effect.beforeAction(context, this);
                                    }
                                }
                                
                                // Skill cooldown is applied when the skill is CHOSEN, not after execution.
                                this.skillCooldowns[methodName] = metadata.cooldown || 0;
                                console.log(`${this.name} initiates skill: ${metadata.name} (Cooldown: ${this.skillCooldowns[methodName]})`);

                                // The definition's skill method is called here.
                                // It now returns an array of sub-action functions.
                                // chosenTargetsFromScene is the relevant team (enemy or ally) passed by BattleScene
                                const subActions = this.definition[methodName](
                                    this, // caster
                                    chosenTargetsFromScene || (metadata.targetType === 'enemy' || metadata.targetType === 'allEnemies' ? livingTargetTeam : livingOwnTeam), // targets for the skill
                                    livingOwnTeam, // ownTeam for context
                                    context        // casterContext {scene, owner, ownTeam, enemyTeam}
                                );

                                // --- afterAction hooks will be moved to BattleScene ---
                                // They should be called after ALL sub-actions for this turn are complete.

                                return subActions; // Return the array of sub-actions to BattleScene
                            }
                        };
                    }
                }
            }
        }

        const basicAttackAction = this.getBasicAttackAction(targetTeam);
         if (targetTeam.filter(t => t && !t.isDefeatedStatus()).length > 0) {
            return basicAttackAction;
        }

        return {
            name: "Pass", caster: this, targetType: 'none',
            execute: () => { // Pass action also returns an array of sub-actions (empty or a log action)
                console.log(`${this.name} passes their turn.`);
                return []; // Return an empty array of sub-actions
            }
        };
    }

    tickSkillCooldowns() { 
        if (this.isDefeated) return;
        for (const methodName in this.skillCooldowns) {
            if (this.skillCooldowns[methodName] > 0) {
                this.skillCooldowns[methodName]--;
                // console.log(`${this.name}'s skill ${methodName} cooldown now ${this.skillCooldowns[methodName]}`); // Can be verbose
            }
        }
    }

    // --- NEW: Global Turn Processing ---
    processGlobalTurnStart(currentGlobalTurn) {
        if (this.isDefeated) return;
        // console.log(`Processing Global Turn ${currentGlobalTurn} Start for ${this.name}`); // Can be verbose
        const context = this.getEffectContext();

        for (let i = this.attachedEffects.length - 1; i >= 0; i--) {
            const effect = this.attachedEffects[i];
            if (!effect.isActive) continue;

            if (typeof effect.tickDuration === 'function') {
                if (effect.tickDuration(currentGlobalTurn)) { 
                    effect.onExpire(context);
                    this.attachedEffects.splice(i, 1);
                    console.log(`Effect ${effect.name} (ID: ${effect.id}) expired from ${this.name} via tickDuration.`);
                    continue; 
                }
            }

            if (effect.isActive && typeof effect.onTick === 'function') { 
                if (effect.onTick(context)) { 
                    effect.onExpire(context); 
                    this.attachedEffects.splice(i, 1);
                    console.log(`Effect ${effect.name} (ID: ${effect.id}) processed and removed from ${this.name} during onTick.`);
                     continue; 
                }
            }
            
            if (effect.isActive && typeof effect.onGlobalTurnStart === 'function') {
                effect.onGlobalTurnStart(context, currentGlobalTurn);
            }
        }
        if (this.isDefeatedStatus() && this.display && !this.display.isDestroyed) { // Check if DoT defeated
            this.display.showDefeated();
        }
    }

    processGlobalTurnEnd(currentGlobalTurn) {
        if (this.isDefeated) return; 
        // console.log(`Processing Global Turn ${currentGlobalTurn} End for ${this.name}`); // Can be verbose
        const context = this.getEffectContext();
        for (const effect of this.attachedEffects) {
            if (effect.isActive && typeof effect.onGlobalTurnEnd === 'function') {
                effect.onGlobalTurnEnd(context, currentGlobalTurn);
            }
        }
    }

    // --- REFINED: Action Phase Hooks ---
    onActionPhaseStart(currentGlobalTurn) { 
        if (this.isDefeated) return;
        // console.log(`--- ${this.name}'s Action Phase starts (Global Turn ${currentGlobalTurn}) ---`); // Already logged by BattleScene
        const context = this.getEffectContext();

        this.tickSkillCooldowns(); 

        for (let i = this.attachedEffects.length - 1; i >= 0; i--) {
            const effect = this.attachedEffects[i];
            if (!effect.isActive) continue;

            if (typeof effect.onActionPhaseStart === 'function') {
                effect.onActionPhaseStart(context, currentGlobalTurn);
            }
        }
    }

    onActionPhaseEnd(currentGlobalTurn) { 
        if (this.isDefeated) return;
        const context = this.getEffectContext();
        for (const effect of this.attachedEffects) {
            if (effect.isActive && typeof effect.onActionPhaseEnd === 'function') {
                effect.onActionPhaseEnd(context, currentGlobalTurn);
            }
        }
    }


    resetForBattle() {
        this.calculateStatsFromLevel();
        this.isDefeated = false;

        const context = this.getEffectContext(); 
        for (const effect of this.attachedEffects) {
            if (typeof effect.onExpire === 'function') {
                effect.onExpire(context); 
            }
        }
        this.attachedEffects = [];
        this.initializeSkillCooldowns();

        if (this.battleSceneContext) {
            this.applyInitialPassiveEffects();
        }
        this.currentHp = Math.min(this.currentHp, this.maxHp);

        if (this.display) {
            this.display.resetDisplay();
            this.display.updateHpDisplay(this.currentHp, this.maxHp);
        }
    }

    modifyStat(statName, amount, isTemporary = false) { 
        if (this.hasOwnProperty(statName)) {
            this[statName] += amount;
            console.log(`${this.name}'s ${statName} modified by ${amount}. New value: ${this[statName]}`);
            if (statName === 'maxHp') {
                this.currentHp = Math.min(this.currentHp, this.maxHp);
                if (amount > 0) this.currentHp += amount; 
                this.currentHp = Math.max(0, Math.min(this.currentHp, this.maxHp));
            }
        } else {
            console.warn(`Cannot modify unknown stat: ${statName}`);
        }
    }

    getCurrentHp() { return this.currentHp; }
    getMaxHp() { return this.maxHp; }
    getCurrentAtk() { return this.currentAtk; }
    getCurrentDef() { return this.currentDef; }
    isDefeatedStatus() { return this.isDefeated; }
    getTeam() { return this.team; }

    removeEffectsByType(typeOrTypesToRemove, context) {
        const typesArray = Array.isArray(typeOrTypesToRemove) ? typeOrTypesToRemove : [typeOrTypesToRemove];
        for (let i = this.attachedEffects.length - 1; i >= 0; i--) {
            const effect = this.attachedEffects[i];
            if (typesArray.includes(effect.type)) {
                effect.onExpire(context); 
                this.attachedEffects.splice(i, 1);
                console.log(`Effect ${effect.type} (ID: ${effect.id}) dispelled from ${this.name}.`);
            }
        }
    }
}

export default BattleCharacter;