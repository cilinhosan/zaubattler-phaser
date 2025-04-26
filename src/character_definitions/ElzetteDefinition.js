// src/character_definitions/ElzetteDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';

export class ElzetteDefinition extends CharacterDefinition {
    constructor() {
        super({
            id: "elzette", // Changed ID
            name: "Elzette", // Changed Name
            // Using Katherine's adjusted stats
            stats: { hp: 480, atk: 85, def: 35, critChance: 0.20, critDamage: 1.80 },
            faction: FACTION.LIGHT, // Changed Faction
            playableByPlayer: true, // Playable
            description: "A radiant warrior.", // Adjusted description
            faceIconKey: 'elzette_face_icon',
            faceIconPath: 'assets/elzette_illustration_face_icon.png',
            battleIconKey: 'elzette_battle_icon',
            battleIconPath: 'assets/elzette_illustration_4_3.png'
        });

        // Copy Katherine's skill metadata (adjust names/descriptions if needed later)
        this.skillMetadata = {
            skillLightBlast: { name: "Light Blast", description: "Deals moderate Light damage to a single enemy.", type: 'active', cooldown: 4, targetType: 'enemy' },
            skillRadiantArea: { name: "Radiant Area", description: "Deals low Light damage to all enemies.", type: 'active', cooldown: 4, targetType: 'allEnemies' },
            skillHeartOfLight: { name: "Heart of Light", description: "Passive: Increases ATK.", type: 'passive', applyImmediately: true, modifiesStats: true },
        };
    }

    // --- Skill Methods (Copy Katherine's logic, adjust faction) ---

    skillLightBlast(caster, targetTeam, ownTeam) {
        const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            SkillHelper.dealDamage(caster, target, 50, FACTION.LIGHT); // Use LIGHT faction
        } else {
            console.log(`${caster.getName()} used Light Blast, but no targets were available.`);
        }
    }

    skillRadiantArea(caster, targetTeam, ownTeam) {
        SkillHelper.dealDamageToAll(caster, targetTeam, 25, FACTION.LIGHT); // Use LIGHT faction
    }

    skillHeartOfLight(caster, targetTeam, ownTeam) {
        console.log(`${caster.getName()}'s Heart of Light passive activates!`);
        // Actual stat modification logic is handled by BattleCharacter based on metadata flags
    }
}