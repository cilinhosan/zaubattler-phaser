// src/game/BattleCharacter.js
import BaseCharacter from './BaseCharacter.js';
import { getCharacterDefinition } from '../CharacterDefinitionList.js'; // Use new definition getter
import * as SkillHelper from './SkillHelper.js'; // Import skill helpers

/**
 * Represents a character specifically within the context of a battle.
 * Handles combat stats, status effects, skill execution, and taking actions.
 * Skills are now methods on the character's definition instance.
 */
export class BattleCharacter extends BaseCharacter {
    constructor(definitionId, level = 1, team = 'player') {
        super(definitionId, level); // Call BaseCharacter constructor

        // Get and store the definition instance
        this.definition = getCharacterDefinition(definitionId);
        if (!this.definition) {
            // BaseCharacter constructor already throws if definitionId is invalid,
            // but double-check in case getCharacterDefinition returns null for other reasons.
            throw new Error(`Failed to get definition instance for ID "${definitionId}" in BattleCharacter`);
        }

        this.team = team; // 'player' or 'enemy'

        // --- Initialize Battle-Specific Stats ---
        // Use methods for calculation and applying passives later
        this.maxHp = 0;
        this.currentHp = 0;
        this.currentAtk = 0;
        this.currentDef = 0;
        this.critChance = 0;
        this.critDamage = 0;
        this.calculateStatsFromLevel(); // Initial calculation

        this.isDefeated = false;
        this.statusEffects = []; // { type: 'burn', duration: 3, magnitude: 10 }

        // --- Initialize Skill Cooldowns ---
        this.skillCooldowns = {}; // Map: { skillMethodName: currentCooldown }
        this.initializeSkillCooldowns();

        // Apply initial passive effects right after stats and skills are set up
        this.applyInitialPassiveEffects();
        // Ensure HP is correct after potential maxHP changes from passives
        this.currentHp = Math.min(this.currentHp, this.maxHp);


        // Reference to the display object (will be set externally by BattleScene/CharacterDisplay)
        this.display = null;
    }

    // --- Stat Calculation ---
    calculateStatsFromLevel() {
        console.log(`Calculating stats for ${this.name} Lvl ${this.level}. Base HP: ${this.baseStats.hp}, Base ATK: ${this.baseStats.atk}, Base DEF: ${this.baseStats.def}`);
        // Basic linear scaling example - TODO: Implement more sophisticated scaling
        const levelMultiplier = 1 + (this.level - 1) * 0.1; // +10% stats per level past 1
        console.log(`Level multiplier: ${levelMultiplier}`);
        this.maxHp = Math.floor(this.baseStats.hp * levelMultiplier);
        this.currentAtk = Math.floor(this.baseStats.atk * levelMultiplier);
        this.currentDef = Math.floor(this.baseStats.def * levelMultiplier);
        this.critChance = this.baseStats.critChance; // Crit chance might scale differently
        this.critDamage = this.baseStats.critDamage; // Crit damage might scale differently

        // Set current HP to max HP after calculation
        this.currentHp = this.maxHp;
        console.log(`${this.name} Lvl ${this.level} stats: HP=${this.maxHp}, ATK=${this.currentAtk}, DEF=${this.currentDef}`);
    }

    // --- Skill Initialization and Management ---
    initializeSkillCooldowns() {
        this.skillCooldowns = {};
        const skillMethods = this.definition.getAllSkillMethods();
        skillMethods.forEach(methodName => {
            const metadata = this.definition.getSkillMetadata(methodName);
            if (metadata && metadata.type === 'active') {
                this.skillCooldowns[methodName] = 0; // Start with 0 cooldown
            }
        });
    }

    // Apply passives that should take effect immediately upon character creation/battle start
    applyInitialPassiveEffects() {
        const skillMethods = this.definition.getAllSkillMethods();
        skillMethods.forEach(methodName => {
            const metadata = this.definition.getSkillMetadata(methodName);
            if (metadata && metadata.type === 'passive' && (metadata.applyImmediately || metadata.modifiesStats)) {
                console.log(`Applying passive effect: ${metadata.name}`);
                // Execute the passive skill method defined in the CharacterDefinition class
                // Pass 'this' (the BattleCharacter instance) as the caster context
                if (typeof this.definition[methodName] === 'function') {
                    this.definition[methodName](this, null, null); // Passives often only need the caster
                    // Note: Actual stat modification should happen within the skill method
                    // or by calling helper methods on this BattleCharacter instance.
                } else {
                     console.warn(`Passive skill method ${methodName} not found on definition for ${this.name}`);
                }
            }
        });
         // Recalculate stats potentially modified by passives (e.g., maxHp)
         // TODO: This needs a more robust system. Passives might modify current stats, not just max.
         // For now, just ensure currentHp doesn't exceed maxHp.
         this.currentHp = Math.min(this.currentHp, this.maxHp);
    }

    // --- Core Combat Methods ---

    takeDamage(amount) {
        if (this.isDefeated) return 0;

        // Basic defense calculation
        const defenseReduction = this.currentDef;
        let actualDamage = Math.max(1, amount - defenseReduction); // Ensure at least 1 damage

        // Basic Critical Hit Check (can be passed in if source matters)
        // This is a simplified check; the source action (basic attack/skill) might determine crit
        const isCrit = Math.random() < this.critChance; // Check against own crit chance (less common)
        if (isCrit) {
             console.log("Critical Hit!");
             actualDamage = Math.floor(actualDamage * this.critDamage);
        }
        // TODO: Add elemental resistances/weaknesses calculation

        this.currentHp -= actualDamage;
        this.currentHp = Math.max(0, this.currentHp); // Clamp HP to 0 minimum
        console.log(`${this.name} takes ${actualDamage} damage. HP: ${this.currentHp}/${this.maxHp}`);

        if (this.currentHp <= 0) {
            this.isDefeated = true;
            console.log(`${this.name} has been defeated!`);
            // TODO: Add event dispatch or callback for defeat (e.g., for BattleScene)
            // this.scene.events.emit('characterDefeated', this.id, this.team);
        }

        // Update display if it exists
        if (this.display) {
            this.display.updateHpDisplay(this.currentHp, this.maxHp);
             if (actualDamage > 0 && !this.isDefeated) {
                 this.display.shake();
                 // TODO: Add damage number popup visual feedback
             }
             if (this.isDefeated) {
                 this.display.showDefeated();
             }
        }

        return actualDamage;
    }

    heal(amount) {
        if (this.isDefeated) return;

        const healAmount = Math.max(0, amount); // Ensure healing is not negative
        this.currentHp += healAmount;
        this.currentHp = Math.min(this.currentHp, this.maxHp); // Clamp HP to maxHp maximum
        console.log(`${this.name} heals for ${healAmount}. HP: ${this.currentHp}/${this.maxHp}`);
        if (this.display) {
            this.display.updateHpDisplay(this.currentHp, this.maxHp);
            // TODO: Add visual feedback for healing (e.g., green number popup)
        }
    }

    // --- Action Determination ---

    getBasicAttackAction(targetTeam) {
        return {
            name: "Basic Attack",
            caster: this,
            targetType: 'enemy', // Used by BattleScene for potential highlighting
            execute: () => {
                const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
                if (livingTargets.length === 0) {
                     console.log(`${this.name} tries Basic Attack, but there are no living targets.`);
                     return;
                }
                const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
                console.log(`${this.name} uses Basic Attack on ${target.name}`);

                // Basic Attack Damage Calculation (including crit)
                let baseDamage = this.currentAtk; // Use current ATK as base
                const isCrit = Math.random() < this.critChance;
                if (isCrit) {
                    console.log("Basic Attack Critical Hit!");
                    baseDamage = Math.floor(baseDamage * this.critDamage);
                }
                // Use SkillHelper, passing calculated base damage
                SkillHelper.dealDamage(this, target, baseDamage, 'physical');
            }
        };
    }

    determineAction(targetTeam, ownTeam) {
        if (this.isDefeated) {
            return null;
        }

        // 1. Check active skills based on definition methods and cooldowns
        const skillMethods = this.definition.getAllSkillMethods();
        for (const methodName of skillMethods) {
            const metadata = this.definition.getSkillMetadata(methodName);

            // Check if it's a usable active skill
            if (metadata && metadata.type === 'active' && this.skillCooldowns[methodName] <= 0) {
                 // Check if the skill method exists on the definition
                 if (typeof this.definition[methodName] === 'function') {
                     console.log(`${this.name} considers using skill: ${metadata.name}`);
                     // Create the action object
                     const action = {
                         name: metadata.name,
                         caster: this,
                         targetType: metadata.targetType || 'enemy', // Default target type
                         execute: () => {
                             console.log(`${this.name} executes skill: ${metadata.name}`);
                             // Call the skill method from the definition instance
                             this.definition[methodName](this, targetTeam, ownTeam);
                             // Set cooldown
                             this.skillCooldowns[methodName] = metadata.cooldown || 0;
                             console.log(`${metadata.name} cooldown set to ${this.skillCooldowns[methodName]}`);
                         }
                     };
                     // TODO: Add pre-execution target validation based on metadata.targetType
                     // e.g., check if valid targets exist before returning the action.
                     // For now, assume the skill method handles invalid targets.
                     return action;
                 } else {
                      console.warn(`Skill method ${methodName} not found on definition for ${this.name}`);
                 }
            }
        }

        // 2. If no usable skills, return basic attack
        const basicAttackAction = this.getBasicAttackAction(targetTeam);
        const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            return basicAttackAction;
        } else {
            console.log(`${this.name} cannot perform Basic Attack, no living targets.`);
            return null; // No action possible
        }
    }

    // --- Turn Management ---

    tickCooldowns() {
        if (this.isDefeated) return;
        for (const methodName in this.skillCooldowns) {
            if (this.skillCooldowns[methodName] > 0) {
                this.skillCooldowns[methodName]--;
                // console.log(`${this.name}'s ${methodName} cooldown: ${this.skillCooldowns[methodName]}`);
            }
        }
    }

    // Apply effects that happen over time (DoTs, HoTs)
    applyStatusEffectsTick() {
         if (this.isDefeated) return;
         // Iterate backwards for safe removal
         for (let i = this.statusEffects.length - 1; i >= 0; i--) {
             const effect = this.statusEffects[i];
             console.log(`Ticking effect ${effect.type} on ${this.name}`);
             // Example: Apply Burn damage
             if (effect.type === 'burn') {
                 console.log(`${this.name} takes ${effect.magnitude} burn damage.`);
                 this.takeDamage(effect.magnitude); // Apply damage directly (might need adjustments)
             }
             // Example: Apply Heal over Time
             if (effect.type === 'regen') {
                  console.log(`${this.name} regenerates ${effect.magnitude} HP.`);
                  this.heal(effect.magnitude);
             }

             // TODO: Add other status effect applications (stat changes, etc.)

             // Decrease duration and remove if expired
             if (effect.duration > 0) {
                 effect.duration--;
                 if (effect.duration <= 0) {
                     console.log(`Status effect ${effect.type} expired on ${this.name}.`);
                     this.statusEffects.splice(i, 1);
                     // TODO: Remove stat modifications if the effect was a buff/debuff
                 }
             }
         }
    }

    // Called at the start of a character's turn
    onTurnStart() {
        if (this.isDefeated) return;
        console.log(`--- ${this.name}'s turn starts ---`);
        this.tickCooldowns(); // Cooldowns tick down first
        this.applyStatusEffectsTick(); // Apply DoTs/HoTs
        // TODO: Check for stun/sleep effects that might prevent action
    }

    // Called at the end of a character's turn
    onTurnEnd() {
        if (this.isDefeated) return;
        // Reduce duration of temporary effects applied *during* the turn (less common)
        // console.log(`--- ${this.name}'s turn ends ---`);
    }

    // --- Utility ---

    resetForBattle() {
        this.calculateStatsFromLevel(); // Recalculate base stats for level
        this.isDefeated = false;
        this.statusEffects = [];
        this.initializeSkillCooldowns(); // Reset all cooldowns
        this.applyInitialPassiveEffects(); // Re-apply passives
        // Ensure HP is correct after potential maxHP changes from passives
        this.currentHp = Math.min(this.currentHp, this.maxHp);

        if (this.display) {
            this.display.resetDisplay();
            this.display.updateHpDisplay(this.currentHp, this.maxHp);
        }
    }

    // --- Stat Modification (Example) ---
    // TODO: Implement a more robust system, potentially tied to status effects
    modifyStat(statName, amount) {
        if (statName === 'currentAtk' || statName === 'currentDef' || statName === 'maxHp' /* etc. */) {
            this[statName] += amount;
            console.log(`${this.name}'s ${statName} modified by ${amount}. New value: ${this[statName]}`);
            // Ensure HP doesn't exceed new maxHP if it was modified
            if (statName === 'maxHp') {
                this.currentHp = Math.min(this.currentHp, this.maxHp);
            }
        } else {
            console.warn(`Cannot modify unknown stat: ${statName}`);
        }
    }


    // --- Getters for current battle stats ---
    getCurrentHp() { return this.currentHp; }
    getMaxHp() { return this.maxHp; }
    getCurrentAtk() { return this.currentAtk; }
    getCurrentDef() { return this.currentDef; }
    isDefeatedStatus() { return this.isDefeated; }
    getTeam() { return this.team; }

}

export default BattleCharacter;