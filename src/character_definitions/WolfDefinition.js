// src/character_definitions/WolfDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';

export class WolfDefinition extends CharacterDefinition {
     constructor() {
        super({
            id: "wolf",
            name: "Wolf",
            // Adjusted stats closer to 500/70/30 baseline (more balanced)
            stats: { hp: 450, atk: 65, def: 25, critChance: 0.10, critDamage: 1.50 },
            faction: FACTION.NEUTRAL,
            playableByPlayer: false,
            description: "A wild wolf.",
            faceIconKey: 'default_character_icon', // Using default player icon for now
            faceIconPath: 'assets/default_character_ilustration_face_icon.png',
            battleIconKey: 'default_enemy_icon', // Use the standard enemy icon key
            battleIconPath: 'assets/default_enemy_illustration_4_3.png' // Use the standard enemy icon path
        });

        this.skillMetadata = {
            skillBite: { name: "Bite", description: "Deals physical damage.", type: 'active', cooldown: 4, targetType: 'enemy' }
        };
    }

     skillBite(caster, targetTeam, ownTeam) {
        const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            SkillHelper.dealDamage(caster, target, 30, FACTION.NEUTRAL); // Base damage 30
        } else {
            console.log(`${caster.getName()} used Bite, but no targets were available.`);
        }
    }
}