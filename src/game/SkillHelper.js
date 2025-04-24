// src/game/SkillHelper.js

/**
 * Contains reusable functions for skill effects.
 * These functions operate on BattleCharacter instances.
 */

/**
 * Deals damage to a single target.
 * @param {BattleCharacter} caster - The character using the skill.
 * @param {BattleCharacter} target - The character receiving damage.
 * @param {number} baseDamage - The base damage amount before calculations.
 * @param {string} damageType - (Optional) Type of damage (e.g., 'physical', 'fire') for potential resistances/weaknesses.
 */
export function dealDamage(caster, target, baseDamage, damageType = 'physical') {
    if (!target || target.isDefeatedStatus()) {
        console.log(`${caster.getName()} tries to attack, but the target is invalid or defeated.`);
        return;
    }
    // Basic damage calculation (incorporate caster's ATK, target's DEF)
    // TODO: Add more complex calculations (critical hits, elemental mods)
    const calculatedDamage = Math.max(1, baseDamage + caster.getCurrentAtk() - target.getCurrentDef());
    console.log(`${caster.getName()} deals ${calculatedDamage} ${damageType} damage to ${target.getName()}.`);
    target.takeDamage(calculatedDamage);
}

/**
 * Deals damage to all characters in a target team.
 * @param {BattleCharacter} caster - The character using the skill.
 * @param {BattleCharacter[]} targetTeam - The array of characters on the opposing team.
 * @param {number} baseDamage - The base damage amount for each target.
 * @param {string} damageType - (Optional) Type of damage.
 */
export function dealDamageToAll(caster, targetTeam, baseDamage, damageType = 'physical') {
    console.log(`${caster.getName()} uses an AOE attack!`);
    targetTeam.forEach(target => {
        // Apply damage to each living target
        if (target && !target.isDefeatedStatus()) {
            dealDamage(caster, target, baseDamage, damageType);
        }
    });
}

/**
 * Heals a single target.
 * @param {BattleCharacter} caster - The character using the skill (can be null if self-heal or item).
 * @param {BattleCharacter} target - The character receiving healing.
 * @param {number} healAmount - The amount to heal.
 */
export function healTarget(caster, target, healAmount) {
     if (!target || target.isDefeatedStatus()) {
        console.log(`Healing failed: Target ${target?.getName() || 'unknown'} is invalid or defeated.`);
        return;
    }
    console.log(`${caster ? caster.getName() : 'Someone'} heals ${target.getName()} for ${healAmount}.`);
    target.heal(healAmount);
}

/**
 * Heals all characters in a target team.
 * @param {BattleCharacter} caster - The character using the skill.
 * @param {BattleCharacter[]} targetTeam - The array of characters to heal.
 * @param {number} healAmount - The amount to heal each target.
 */
export function healAll(caster, targetTeam, healAmount) {
    console.log(`${caster.getName()} uses an AOE heal!`);
    targetTeam.forEach(target => {
        if (target && !target.isDefeatedStatus()) {
            healTarget(caster, target, healAmount);
        }
    });
}

// TODO: Add functions for applying/removing status effects (buffs, debuffs, DoTs)
// export function applyStatusEffect(caster, target, effectType, duration, magnitude) { ... }
// export function removeStatusEffect(target, effectType) { ... }

// TODO: Add functions for modifying stats temporarily (buffs/debuffs)
// export function modifyStat(target, stat, amount, duration) { ... }