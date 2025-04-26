// src/character_definitions/GoblinDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';

export class GoblinDefinition extends CharacterDefinition {
    constructor() {
        super({
            id: "goblin",
            name: "Goblin",
            // Adjusted stats closer to 500/70/30 baseline (still weaker)
            stats: { hp: 350, atk: 50, def: 20, critChance: 0.05, critDamage: 1.50 },
            faction: FACTION.NEUTRAL,
            playableByPlayer: false, // Make Goblin playable for testing pool
            description: "A weak but annoying goblin."
        });

        this.skillMetadata = {
            skillPoke: { name: "Poke", description: "Deals minor damage.", type: 'active', cooldown: 4, targetType: 'enemy' }
        };
    }

    skillPoke(caster, targetTeam, ownTeam) {
        const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            SkillHelper.dealDamage(caster, target, 10, FACTION.NEUTRAL); // Base damage 10
        } else {
            console.log(`${caster.getName()} used Poke, but no targets were available.`);
        }
    }
}