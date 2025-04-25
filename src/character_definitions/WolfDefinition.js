// src/character_definitions/WolfDefinition.js
import { CharacterDefinition, ELEMENTS } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';

export class WolfDefinition extends CharacterDefinition {
     constructor() {
        super({
            id: "wolf",
            name: "Wolf",
            // Adjusted stats closer to 500/70/30 baseline (more balanced)
            stats: { hp: 450, atk: 65, def: 25, critChance: 0.10, critDamage: 1.50 },
            element: ELEMENTS.NEUTRAL,
            playableByPlayer: false,
            description: "A wild wolf."
        });

         this.skillMetadata = {
            skillBite: { name: "Bite", description: "Deals physical damage.", type: 'active', cooldown: 4, targetType: 'enemy' }
        };
    }

     skillBite(caster, targetTeam, ownTeam) {
        const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            SkillHelper.dealDamage(caster, target, 30, ELEMENTS.NEUTRAL); // Base damage 30
        } else {
            console.log(`${caster.getName()} used Bite, but no targets were available.`);
        }
    }
}