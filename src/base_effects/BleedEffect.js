// src/base_effects/BleedEffect.js
import AttachedEffect from '../game/AttachedEffect.js';

// --- Define BleedEffect ---
export class BleedEffect extends AttachedEffect { // Added export
    constructor({ owner, sourceSkillId, turns = 2, damagePercentage = 0.05 }) {
        super({
            owner,
            type: 'bleed', // Unique type for this specific bleed
            duration: turns,
            sourceSkillId,
            name: "Bleed",
            description: `Loses ${damagePercentage * 100}% of Max HP each turn. Duration: ${turns} turns.`,
            isBuff: false,
            isHidden: false,
        });
        this.damagePercentage = damagePercentage;
        this.tickDamage = Math.floor(this.owner.maxHp * this.damagePercentage);
    }

    onApply(context) {
        super.onApply(context);
        this.tickDamage = Math.floor(this.owner.maxHp * this.damagePercentage); // Use owner's maxHp
        this.description = `Losing ${this.tickDamage} (${this.damagePercentage * 100}%) HP each turn. Remaining: ${this.duration} turns.`;
        // BattleCharacter.addAttachedEffect already logs the application of the effect.
        // if (context && context.scene && context.scene.addBattleLogMessage) {
        //     context.scene.addBattleLogMessage(`${this.owner.name} starts bleeding for ${this.tickDamage} damage per turn.`);
        // }
        if (this.owner.refreshEffectDisplay) this.owner.refreshEffectDisplay(this);
    }

    onTick(context) {
        if (this.owner && !this.owner.isDefeatedStatus() && context && context.scene) {
            // The takeDamage method in BattleCharacter will log the damage taken.
            // console.log(`${this.owner.name} takes ${this.tickDamage} damage from Bleed (onTick).`); // Dev log
            if (context.scene.addBattleLogMessage) {
                 context.scene.addBattleLogMessage(`${this.owner.name} takes ${this.tickDamage} damage from ${this.name}.`);
            }
            this.owner.takeDamage(this.tickDamage, this, 'bleed', false, {}, context.scene); // Pass 'this' as source, and scene

            this.description = `Losing ${this.tickDamage} (${this.damagePercentage * 100}%) HP each turn. Remaining: ${this.duration} turns.`;
            if (this.owner.refreshEffectDisplay) this.owner.refreshEffectDisplay(this);
        }
        return false; // Return false to indicate the effect should not be removed by onTick itself
    }

    onExpire(context) {
        super.onExpire(context);
        // BattleCharacter.removeAttachedEffectById (called by tickDuration) logs generic effect expiration.
        // If a more specific message is needed for Bleed expiring, it can be added here.
        // console.log(`Bleed expired for ${this.owner.name}.`); // Dev log
        if (context && context.scene && context.scene.addBattleLogMessage) {
            context.scene.addBattleLogMessage(`${this.name} on ${this.owner.name} has worn off.`);
        }
    }
}