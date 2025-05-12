// src/character_definitions/WolfDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';
import AttachedEffect from '../game/AttachedEffect.js';

// --- Define a specific effect for Pack Hunter (Crit Chance Boost) ---
class PackHunterEffect extends AttachedEffect {
    constructor({ owner, sourceSkillId, critChanceBonus }) {
        super({
            owner,
            type: 'passive_crit_chance_boost_wolf',
            duration: Infinity,
            sourceSkillId,
            name: "Pack Hunter",
            description: `Increases Critical Hit Chance by ${critChanceBonus * 100}%.`,
            isBuff: true,
            isHidden: false,
        });
        this.critChanceBonus = critChanceBonus;
        this.applied = false;
    }

    onApply(context) {
        super.onApply(context);
        if (!this.applied) {
            this.owner.critChance += this.critChanceBonus;
            // Ensure critChance doesn't exceed a reasonable cap, e.g., 1.0 (100%)
            this.owner.critChance = Math.min(this.owner.critChance, 1.0);
            console.log(`${this.owner.name}'s Pack Hunter boosted Crit Chance by ${this.critChanceBonus * 100}%. New Crit Chance: ${this.owner.critChance * 100}%`);
            this.applied = true;
        }
    }

    onExpire(context) {
        super.onExpire(context);
        // if (this.applied) { this.owner.critChance -= this.critChanceBonus; }
        console.log(`Pack Hunter effect removed from ${this.owner.name} (if it were dispellable).`);
    }
}


export class WolfDefinition extends CharacterDefinition {
     constructor() {
        super({
            id: "wolf",
            name: "Wolf",
            stats: { hp: 450, atk: 80, def: 25, critChance: 0.10, critDamage: 1.50 }, // ATK increased to 80
            faction: FACTION.NEUTRAL,
            playableByPlayer: false,
            description: "A wild wolf.",
            faceIconKey: 'default_character_icon',
            faceIconPath: 'assets/default_character_ilustration_face_icon.png',
            battleIconKey: 'default_enemy_icon',
            battleIconPath: 'assets/default_enemy_illustration_4_3.png'
        });

        this.skillMetadata = {
            skillBite: { id: "wolf_bite", name: "Bite", description: "Deals physical damage.", type: 'active', cooldown: 3, targetType: 'enemy' },
            skillPackHunter: { id: "wolf_pack_hunter", name: "Pack Hunter", description: "Passive: Increases Critical Hit Chance by 10%.", type: 'passive', applyImmediately: true, modifiesStats: true }
        };
    }

    skillBite(caster, targets, ownTeam, casterContext) {
        const battleScene = casterContext.scene;
        if (!battleScene) {
            console.error("WolfDefinition.skillBite: BattleScene context not available!");
            return;
        }

        const livingTargets = targets.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            const damage = caster.currentAtk * 1.0; // Adjusted multiplier for new ATK (80 * 1.0 = 80)
            console.log(`${caster.getName()} bites ${target.getName()}!`);
            SkillHelper.dealDamage(caster, target, Math.floor(damage), FACTION.NEUTRAL, { skillId: this.skillMetadata.skillBite.id }, battleScene);
        } else {
            console.log(`${caster.getName()} used Bite, but no targets were available.`);
        }
    }

    skillPackHunter(caster, targetTeam, ownTeam, casterContext) {
        console.log(`${caster.getName()}'s Pack Hunter passive is being initialized.`);
        const critChanceBonus = 0.10; // +10% crit chance

        const effect = new PackHunterEffect({
            owner: caster,
            sourceSkillId: this.skillMetadata.skillPackHunter.id,
            critChanceBonus: critChanceBonus
        });
        caster.addAttachedEffect(effect);
    }
}