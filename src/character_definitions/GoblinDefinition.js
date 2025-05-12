// src/character_definitions/GoblinDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';
import AttachedEffect from '../game/AttachedEffect.js';

// --- Define a specific effect for Scavenger's Resilience (HP Boost) ---
class ScavengersResilienceEffect extends AttachedEffect {
    constructor({ owner, sourceSkillId, hpBonus }) {
        super({
            owner,
            type: 'passive_hp_boost_goblin',
            duration: Infinity,
            sourceSkillId,
            name: "Scavenger's Resilience",
            description: `Increases Max HP by ${hpBonus}.`,
            isBuff: true,
            isHidden: false,
        });
        this.hpBonus = hpBonus;
        this.applied = false;
    }

    onApply(context) {
        super.onApply(context);
        if (!this.applied) {
            this.owner.maxHp += this.hpBonus;
            this.owner.currentHp += this.hpBonus; // Also increase current HP by the same amount
            // Ensure currentHp doesn't exceed new maxHp (though it shouldn't if applied at start)
            this.owner.currentHp = Math.min(this.owner.currentHp, this.owner.maxHp);
            console.log(`${this.owner.name}'s Scavenger's Resilience boosted Max HP by ${this.hpBonus}. New Max HP: ${this.owner.maxHp}`);
            this.applied = true;
            // Update display if available
            if (this.owner.display) {
                this.owner.display.updateHpDisplay(this.owner.currentHp, this.owner.maxHp);
            }
        }
    }

    onExpire(context) {
        super.onExpire(context);
        // If this effect could be dispelled, revert the HP changes
        // if (this.applied) {
        //     this.owner.maxHp -= this.hpBonus;
        //     this.owner.currentHp = Math.min(this.owner.currentHp, this.owner.maxHp); // Adjust current HP
        //     if (this.owner.display) {
        //         this.owner.display.updateHpDisplay(this.owner.currentHp, this.owner.maxHp);
        //     }
        // }
        console.log(`Scavenger's Resilience effect removed from ${this.owner.name} (if it were dispellable).`);
    }
}


export class GoblinDefinition extends CharacterDefinition {
    constructor() {
        super({
            id: "goblin",
            name: "Goblin",
            stats: { hp: 350, atk: 80, def: 20, critChance: 0.05, critDamage: 1.50 }, // ATK increased to 80
            faction: FACTION.NEUTRAL,
            playableByPlayer: false,
            description: "A weak but annoying goblin.",
            faceIconKey: 'default_character_icon', // Using default player icon
            faceIconPath: 'assets/default_character_ilustration_face_icon.png',
            battleIconKey: 'default_enemy_icon', // Use the standard enemy icon key
            battleIconPath: 'assets/default_enemy_illustration_4_3.png' // Use the standard enemy icon path
        });

        this.skillMetadata = {
            skillPoke: { id: "goblin_poke", name: "Poke", description: "Deals minor damage.", type: 'active', cooldown: 3, targetType: 'enemy' },
            skillScavengersResilience: { id: "goblin_scavengers_resilience", name: "Scavenger's Resilience", description: "Passive: Slightly increases Max HP.", type: 'passive', applyImmediately: true, modifiesStats: true }
        };
    }

    skillPoke(caster, targets, ownTeam, casterContext) {
        const battleScene = casterContext.scene;
        if (!battleScene) {
            console.error("GoblinDefinition.skillPoke: BattleScene context not available!");
            return;
        }

        const livingTargets = targets.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            const damage = caster.currentAtk * 0.8; // Adjusted multiplier for new ATK (80 * 0.8 = 64)
            console.log(`${caster.getName()} pokes ${target.getName()}!`);
            SkillHelper.dealDamage(caster, target, Math.floor(damage), FACTION.NEUTRAL, { skillId: this.skillMetadata.skillPoke.id }, battleScene);
        } else {
            console.log(`${caster.getName()} used Poke, but no targets were available.`);
        }
    }

    skillScavengersResilience(caster, targetTeam, ownTeam, casterContext) {
        console.log(`${caster.getName()}'s Scavenger's Resilience passive is being initialized.`);
        const hpBonus = 50; 

        const effect = new ScavengersResilienceEffect({
            owner: caster,
            sourceSkillId: this.skillMetadata.skillScavengersResilience.id,
            hpBonus: hpBonus
        });
        caster.addAttachedEffect(effect);
    }
}