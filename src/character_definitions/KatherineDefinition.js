// src/character_definitions/KatherineDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';

export class KatherineDefinition extends CharacterDefinition {
    constructor() {
        super({
            id: "katherine",
            name: "Katherine",
            // Adjusted stats closer to 500/70/30 baseline
            stats: { hp: 480, atk: 85, def: 35, critChance: 0.20, critDamage: 1.80 },
            faction: FACTION.CRIMSON,
            playableByPlayer: true,
            description: "A fiery warrior.",
            faceIconKey: 'default_character_icon',
            faceIconPath: 'assets/default_character_ilustration_face_icon.png',
            battleIconKey: 'default_battle_icon',
            battleIconPath: 'assets/default_character_ilustration_4_3.png'
        });

        // Define skill metadata (name, description, type, cooldown, targetType)
        this.skillMetadata = {
            skillFireBlast: { name: "Fire Blast", description: "Deals moderate damage to a single enemy.", type: 'active', cooldown: 4, targetType: 'enemy' },
            skillVolcanicArea: { name: "Volcanic Area", description: "Deals low damage to all enemies.", type: 'active', cooldown: 4, targetType: 'allEnemies' },
            skillHeartOfFire: { name: "Heart of Fire", description: "Passive: Increases ATK.", type: 'passive', applyImmediately: true, modifiesStats: true },
            // skillFlameDeath: { name: "Flame Death", description: "...", type: 'active', cooldown: 5, targetType: 'enemy' }
        };
    }

    // --- Skill Methods ---
    // These methods receive the caster (BattleCharacter) and target/team context.

    skillFireBlast(caster, targetTeam) {
        // Target a single random living enemy
        let damageOutput = this.stats.atk * 2
        const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            SkillHelper.dealDamage(caster, target, damageOutput); // Base damage 50
        } else {
            console.log(`${caster.getName()} used Fire Blast, but no targets were available.`);
        }
    }

    skillVolcanicArea(caster, targetTeam) {
        let damageOutput = this.stats.atk * 1.2
        SkillHelper.dealDamageToAll(caster, targetTeam, damageOutput);
    }

    skillHeartOfFire(caster, targetTeam, ownTeam) {
        // Passive effect applied by BattleCharacter based on metadata
        console.log(`${caster.getName()}'s Heart of Fire passive activates!`);
        // Example: Increase ATK (BattleCharacter needs methods to modify current stats)
        // caster.modifyStat('currentAtk', caster.getBaseStat('atk') * 0.1); // +10% base ATK
        // For now, just log activation. Stat modification needs BattleCharacter methods.
        // This logic might be better placed in BattleCharacter's applyPassiveEffects
        // triggered by the 'modifiesStats' flag.
    }
}