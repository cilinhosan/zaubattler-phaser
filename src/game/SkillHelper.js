// src/game/SkillHelper.js

/**
 * Contains reusable functions for skill effects.
 * These functions operate on BattleCharacter instances.
 */

/**
 * Deals damage to a single target, incorporating AttachedEffect hooks.
 * @param {BattleCharacter} caster - The character using the skill.
 * @param {BattleCharacter} target - The character receiving damage.
 * @param {number} baseAmount - The base damage amount before any modifications.
 * @param {string} damageType - Type of damage (e.g., 'physical', 'fire').
 * @param {object} [options={}] - Additional options.
 * @param {boolean} [options.isCrit=false] - Whether this hit is a critical hit.
 * @param {string} [options.skillId=null] - The ID of the skill causing this damage.
 * @param {boolean} [options.isThornsDamage=false] - If this damage is from a reactive effect like thorns.
 * @param {BattleScene} battleScene - The current BattleScene instance for context.
 */
export function dealDamage(caster, target, baseAmount, damageType = 'physical', options = {}, battleScene) {
    if (!caster || !target || target.isDefeatedStatus()) {
        console.log(`${caster?.getName() || 'Unknown caster'} tries to attack, but the target ${target?.getName() || 'unknown'} is invalid or defeated.`);
        return;
    }
    if (!battleScene) {
        console.error("SkillHelper.dealDamage requires battleScene context!");
        // Fallback or throw error, for now, we'll proceed with a warning
        // but effects relying on scene context will fail.
    }

    const casterContext = caster.getEffectContext(); // Gets { scene, owner: caster }
    // const targetContext = target.getEffectContext(); // Gets { scene, owner: target } // Not directly used here, target.takeDamage uses its own

    let damageInfo = {
        baseAmount: baseAmount,    // Original base amount from skill/action
        amount: baseAmount,        // Amount to be modified by caster's effects
        finalAmount: 0,            // Will be calculated by target.takeDamage
        source: caster,
        damageType: damageType,
        isCrit: options.isCrit || false,
        skillId: options.skillId || null,
        isThornsDamage: options.isThornsDamage || false,
        // Add other flags as needed by effects
    };

    // 1. Trigger onDealingDamage hooks for caster's attached effects
    // These can modify damageInfo.amount before it's sent to the target
    if (!damageInfo.isThornsDamage) { // Prevent thorns from triggering offensive onDealingDamage effects from self
        for (const effect of caster.attachedEffects) {
            if (effect.isActive && typeof effect.onDealingDamage === 'function') {
                damageInfo = effect.onDealingDamage(casterContext, target, damageInfo) || damageInfo;
            }
        }
    }
    
    // Log after caster's modifications
    // console.log(`${caster.getName()} attempts to deal ${damageInfo.amount} (modified from ${damageInfo.baseAmount}) ${damageInfo.damageType} damage to ${target.getName()}. Crit: ${damageInfo.isCrit}`);

    // 2. Target takes damage. target.takeDamage will handle its own onDamageTaken hooks.
    // The amount passed to takeDamage is the one modified by the caster's onDealingDamage effects.
    target.takeDamage(damageInfo.amount, caster, damageInfo.damageType, damageInfo.isCrit, { isThornsDamage: damageInfo.isThornsDamage });
}

/**
 * Deals damage to all characters in a target team.
 * @param {BattleCharacter} caster - The character using the skill.
 * @param {BattleCharacter[]} targetTeam - The array of characters on the opposing team.
 * @param {number} baseDamage - The base damage amount for each target.
 * @param {string} damageType - (Optional) Type of damage.
 * @param {object} [options={}] - Additional options (isCrit, skillId).
 * @param {BattleScene} battleScene - The current BattleScene instance for context.
 */
export function dealDamageToAll(caster, targetTeam, baseDamage, damageType = 'physical', options = {}, battleScene) {
    console.log(`${caster.getName()} uses an AOE attack!`);
    targetTeam.forEach(target => {
        if (target && !target.isDefeatedStatus()) {
            // Pass along options and battleScene context
            dealDamage(caster, target, baseDamage, damageType, options, battleScene);
        }
    });
}

/**
 * Heals a single target.
 * @param {BattleCharacter} caster - The character using the skill (can be null if self-heal or item).
 * @param {BattleCharacter} target - The character receiving healing.
 * @param {number} healAmount - The amount to heal.
 * @param {BattleScene} battleScene - The current BattleScene instance for context. (Optional for heal, but good practice)
 */
export function healTarget(caster, target, healAmount, battleScene) {
     if (!target || target.isDefeatedStatus()) {
        console.log(`Healing failed: Target ${target?.getName() || 'unknown'} is invalid or defeated.`);
        return;
    }
    // TODO: Implement onHealing and onHealReceived hooks if needed, similar to damage
    // For now, directly call heal.
    console.log(`${caster ? caster.getName() : 'Someone'} heals ${target.getName()} for ${healAmount}.`);
    target.heal(healAmount, caster); // Pass caster to target.heal
}

/**
 * Heals all characters in a target team.
 * @param {BattleCharacter} caster - The character using the skill.
 * @param {BattleCharacter[]} targetTeam - The array of characters to heal.
 * @param {number} healAmount - The amount to heal each target.
 * @param {BattleScene} battleScene - The current BattleScene instance for context. (Optional for heal)
 */
export function healAll(caster, targetTeam, healAmount, battleScene) {
    console.log(`${caster.getName()} uses an AOE heal!`);
    targetTeam.forEach(target => {
        if (target && !target.isDefeatedStatus()) {
            healTarget(caster, target, healAmount, battleScene);
        }
    });
}

/**
 * Applies an AttachedEffect to a target.
 * @param {BattleCharacter} caster - The character applying the effect.
 * @param {BattleCharacter} target - The character receiving the effect.
 * @param {AttachedEffect} effectInstance - An instance of a class that extends AttachedEffect.
 * @param {BattleScene} battleScene - The current BattleScene instance for context.
 */
export function applyAttachedEffect(caster, target, effectInstance, battleScene) {
    if (!target || target.isDefeatedStatus()) {
        console.log(`Cannot apply effect ${effectInstance?.type || 'unknown'} to ${target?.getName() || 'unknown'}: target invalid or defeated.`);
        return;
    }
    if (!effectInstance) {
        console.error("SkillHelper.applyAttachedEffect: effectInstance is null or undefined.");
        return;
    }
    // Ensure the effect's owner is correctly set to the target
    // This might be redundant if effectInstance is always created with the target as owner,
    // but good for safety if an effect could be "transferred" or applied by a non-owner.
    effectInstance.owner = target;

    target.addAttachedEffect(effectInstance);
    // console.log(`${caster.getName()} applies effect ${effectInstance.type} to ${target.getName()}.`);
}

/**
 * Removes AttachedEffects of a specific type (or types) from a target.
 * @param {BattleCharacter} caster - The character initiating the removal (can be null).
 * @param {BattleCharacter} target - The character whose effects are to be removed.
 * @param {string | string[]} typeOrTypesToRemove - The type or array of types of effects to remove.
 * @param {BattleScene} battleScene - The current BattleScene instance for context.
 */
export function removeAttachedEffects(caster, target, typeOrTypesToRemove, battleScene) {
    if (!target) {
        console.log(`Cannot remove effects: target is invalid.`);
        return;
    }
    const targetContext = target.getEffectContext();
    target.removeEffectsByType(typeOrTypesToRemove, targetContext); // BattleCharacter handles its own context now
    // console.log(`${caster ? caster.getName() : 'Someone'} attempts to remove effects [${typeOrTypesToRemove}] from ${target.getName()}.`);
}

// TODO: Add functions for modifying stats directly (less common now, prefer effects)
// export function modifyStat(target, stat, amount, duration, battleScene) { ... }