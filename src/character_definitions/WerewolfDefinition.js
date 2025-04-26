// src/character_definitions/WerewolfDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';

export class WerewolfDefinition extends CharacterDefinition {
     constructor() {
        super({
            id: "werewolf",
            name: "Werewolf",
            // Adjusted stats closer to 500/70/30 baseline (stronger)
            stats: { hp: 550, atk: 80, def: 40, critChance: 0.15, critDamage: 1.70 },
            faction: FACTION.DARK,
            playableByPlayer: false,
            description: "A fearsome werewolf."
        });

         this.skillMetadata = {
            skillRavage: { name: "Ravage", description: "Deals heavy physical damage.", type: 'active', cooldown: 4, targetType: 'enemy' }
            // TODO: Add more skills?
        };
    }

     skillRavage(caster, targetTeam, ownTeam) {
        const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            SkillHelper.dealDamage(caster, target, 80, FACTION.NEUTRAL); // Base damage 80
        } else {
            console.log(`${caster.getName()} used Ravage, but no targets were available.`);
        }
    }
}