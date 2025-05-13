// src/character_definitions/CursedWolfDefinition.js
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


export class CursedWolfDefinition extends CharacterDefinition { // Renamed class
     constructor() {
        super({
            id: "cursedWolf", // Changed ID
            name: "Cursed Wolf", // Changed name
            stats: { hp: 850, atk: 80, def: 50, critChance: 0.10, critDamage: 1.50 }, // ATK increased to 80
            faction: FACTION.NEUTRAL,
            playableByPlayer: false,
            description: "A wild, cursed wolf.", // Updated description
            faceIconKey: 'default_character_icon', // Consider updating if new assets are made
            faceIconPath: 'assets/default_character_ilustration_face_icon.png',
            battleIconKey: 'default_enemy_icon', // Consider updating if new assets are made
            battleIconPath: 'assets/default_enemy_illustration_4_3.png'
        });

        // Update skill IDs to reflect new character ID for clarity, though not strictly necessary if skills are generic
        this.skillMetadata = {
            skillBite: { id: "cursed_wolf_bite", name: "Bite", description: "Deals physical damage.", type: 'active', cooldown: 3, targetType: 'enemy' },
            skillPackHunter: { id: "cursed_wolf_pack_hunter", name: "Pack Hunter", description: "Passive: Increases Critical Hit Chance by 10%.", type: 'passive', applyImmediately: true, modifiesStats: true }
        };
    }

    skillBite(caster, targets, ownTeam, casterContext) {
        const battleScene = casterContext.scene;
        if (!battleScene) {
            console.error("CursedWolfDefinition.skillBite: BattleScene context not available!"); // Updated class name in error
            return;
        }

        const livingTargets = targets.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            const damage = Math.floor(caster.currentAtk * 1.8); // Adjusted multiplier for new ATK (80 * 1.0 = 80)
            console.log(`${caster.getName()} bites ${target.getName()}!`);
            SkillHelper.dealDamage(caster, target, damage, FACTION.NEUTRAL, { skillId: this.skillMetadata.skillBite.id }, battleScene);
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