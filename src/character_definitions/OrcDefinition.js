// src/character_definitions/OrcDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';

export class OrcDefinition extends CharacterDefinition {
     constructor() {
        super({
            id: "orc",
            name: "Orc",
            // Adjusted stats closer to 500/70/30 baseline (tankier)
            stats: { hp: 600, atk: 70, def: 45, critChance: 0.10, critDamage: 1.60 },
            faction: FACTION.SEPIA,
            playableByPlayer: false,
            description: "A brutish Orc.",
            faceIconKey: 'default_character_icon', // Using default player icon for now
            faceIconPath: 'assets/default_character_ilustration_face_icon.png',
            battleIconKey: 'default_enemy_icon', // Use the standard enemy icon key
            battleIconPath: 'assets/default_enemy_illustration_4_3.png' // Use the standard enemy icon path
        });

        this.skillMetadata = {
            skillHeavyStrike: { name: "Heavy Strike", description: "Deals significant damage.", type: 'active', cooldown: 4, targetType: 'enemy' }
        };
    }

     skillHeavyStrike(caster, targetTeam, ownTeam) {
        const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            SkillHelper.dealDamage(caster, target, 70, FACTION.SEPIA); // Base damage 70
        } else {
            console.log(`${caster.getName()} used Heavy Strike, but no targets were available.`);
        }
    }
}