/**
 * Centralized place for defining skill effect functions.
 * Each function takes (caster, targetTeam, casterTeam) as arguments.
 */

// Example Active Skill Effect: Fire Blast
const fireBlastEffect = (caster, targetTeam, casterTeam) => {
    console.log(`${caster.name} unleashes Fire Blast!`);
    const damage = caster.atk * 2; // 200% of ATK

    if (!targetTeam || targetTeam.length === 0) {
        console.log("No targets for Fire Blast.");
        return;
    }

    targetTeam.forEach(target => {
        if (!target.isDefeated) { // Only hit living targets
            target.takeDamage(damage);
        }
    });
};

// Example Passive Skill Effect: ATK Boost
const atkBoostPassiveEffect = (caster, targetTeam, casterTeam) => {
    const boostAmount = caster.baseAtk * 0.1; // 10% of base ATK
    caster.atk += boostAmount;
    console.log(`${caster.name}'s ATK increased by ${boostAmount} due to passive. New ATK: ${caster.atk}`);
};


export {
    fireBlastEffect,
    atkBoostPassiveEffect,
};