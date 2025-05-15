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
        if (this.owner.refreshEffectDisplay) this.owner.refreshEffectDisplay(this);
    }

    onTick(context) {
        if (this.owner && !this.owner.isDefeatedStatus() && context && context.scene) {
            console.log(`${this.owner.name} takes ${this.tickDamage} damage from Bleed (onTick).`);
            this.owner.takeDamage(this.tickDamage, this.name);

            this.description = `Losing ${this.tickDamage} (${this.damagePercentage * 100}%) HP each turn. Remaining: ${this.duration} turns.`;
            if (this.owner.refreshEffectDisplay) this.owner.refreshEffectDisplay(this);
        }
        return false;
    }

    onExpire(context) {
        super.onExpire(context);
        console.log(`Bleed expired for ${this.owner.name}.`);
    }
}