// src/CharacterDefinitionList.js
import * as SkillHelper from './game/SkillHelper.js';

// Define Elements using a constant object
export const ELEMENTS = Object.freeze({
    LIGHT: 'Light',
    FIRE: 'Fire',
    PLANT: 'Plant',
    WATER: 'Water',
    EARTH: 'Earth',
    DARK: 'Dark',
    NEUTRAL: 'Neutral'
});

/**
 * Base class for all character definitions.
 * Contains common properties and structure.
 */
class CharacterDefinition {
    constructor({ id, name, stats, element, playableByPlayer = false, description = "" }) {
        if (!id || !name || !stats || !element) {
            throw new Error("Missing required fields for CharacterDefinition: id, name, stats, element");
        }
        this.id = id;
        this.name = name;
        this.stats = { // Ensure all expected stats are present
            hp: stats.hp ?? 50,
            atk: stats.atk ?? 10,
            def: stats.def ?? 5,
            critChance: stats.critChance ?? 0.05, // Default 5%
            critDamage: stats.critDamage ?? 1.5   // Default +50%
        };
        this.element = element;
        this.playableByPlayer = playableByPlayer;
        this.description = description;

        // Skills will be defined as methods in subclasses,
        // and metadata stored in a separate structure.
        this.skillMetadata = {};
    }

    // Placeholder for getting skill metadata - subclasses should populate this.skillMetadata
    getSkillMetadata(skillMethodName) {
        return this.skillMetadata[skillMethodName];
    }

    // Placeholder for getting all skill method names
    getAllSkillMethods() {
        // Introspect the class prototype to find methods intended as skills
        // (e.g., methods starting with 'skill' or listed explicitly)
        // This is a simplified example; a more robust approach might be needed.
        return Object.getOwnPropertyNames(Object.getPrototypeOf(this))
            .filter(prop => prop.startsWith('skill') && typeof this[prop] === 'function');
    }
}

// --- Specific Character Definition Classes ---

class KatherineDefinition extends CharacterDefinition {
    constructor() {
        super({
            id: "katherine",
            name: "Katherine",
            // Adjusted stats closer to 500/70/30 baseline
            stats: { hp: 480, atk: 85, def: 35, critChance: 0.20, critDamage: 1.80 },
            element: ELEMENTS.FIRE,
            playableByPlayer: true,
            description: "A fiery warrior."
        });

        // Define skill metadata (name, description, type, cooldown, targetType)
        this.skillMetadata = {
            skillFireBlast: { name: "Fire Blast", description: "Deals moderate Fire damage to a single enemy.", type: 'active', cooldown: 0, targetType: 'enemy' },
            skillVolcanicArea: { name: "Volcanic Area", description: "Deals low Fire damage to all enemies.", type: 'active', cooldown: 3, targetType: 'all_enemies' },
            skillHeartOfFire: { name: "Heart of Fire", description: "Passive: Increases ATK.", type: 'passive', applyImmediately: true, modifiesStats: true },
            // skillFlameDeath: { name: "Flame Death", description: "...", type: 'active', cooldown: 5, targetType: 'enemy' }
        };
    }

    // --- Skill Methods ---
    // These methods receive the caster (BattleCharacter) and target/team context.

    skillFireBlast(caster, targetTeam, ownTeam) {
        // Target a single random living enemy
        const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            SkillHelper.dealDamage(caster, target, 50, ELEMENTS.FIRE); // Base damage 50
        } else {
            console.log(`${caster.getName()} used Fire Blast, but no targets were available.`);
        }
    }

    skillVolcanicArea(caster, targetTeam, ownTeam) {
        SkillHelper.dealDamageToAll(caster, targetTeam, 25, ELEMENTS.FIRE); // Base damage 25 to all
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

    // skillFlameDeath(caster, targetTeam, ownTeam) {
    //     // TODO: Implement Flame Death logic
    // }
}

// --- Elzette (Copy of Katherine, Light Element) ---
class ElzetteDefinition extends CharacterDefinition {
    constructor() {
        super({
            id: "elzette", // Changed ID
            name: "Elzette", // Changed Name
            // Using Katherine's adjusted stats
            stats: { hp: 480, atk: 85, def: 35, critChance: 0.20, critDamage: 1.80 },
            element: ELEMENTS.LIGHT, // Changed Element
            playableByPlayer: true, // Playable
            description: "A radiant warrior." // Adjusted description
        });

        // Copy Katherine's skill metadata (adjust names/descriptions if needed later)
        this.skillMetadata = {
            skillLightBlast: { name: "Light Blast", description: "Deals moderate Light damage to a single enemy.", type: 'active', cooldown: 0, targetType: 'enemy' },
            skillRadiantArea: { name: "Radiant Area", description: "Deals low Light damage to all enemies.", type: 'active', cooldown: 3, targetType: 'all_enemies' },
            skillHeartOfLight: { name: "Heart of Light", description: "Passive: Increases ATK.", type: 'passive', applyImmediately: true, modifiesStats: true },
        };
    }

    // --- Skill Methods (Copy Katherine's logic, adjust element) ---

    skillLightBlast(caster, targetTeam, ownTeam) {
        const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            SkillHelper.dealDamage(caster, target, 50, ELEMENTS.LIGHT); // Use LIGHT element
        } else {
            console.log(`${caster.getName()} used Light Blast, but no targets were available.`);
        }
    }

    skillRadiantArea(caster, targetTeam, ownTeam) {
        SkillHelper.dealDamageToAll(caster, targetTeam, 25, ELEMENTS.LIGHT); // Use LIGHT element
    }

    skillHeartOfLight(caster, targetTeam, ownTeam) {
        console.log(`${caster.getName()}'s Heart of Light passive activates!`);
        // Actual stat modification logic is handled by BattleCharacter based on metadata flags
    }
}
// --- End Elzette ---


class GoblinDefinition extends CharacterDefinition {
    constructor() {
        super({
            id: "goblin",
            name: "Goblin",
            // Adjusted stats closer to 500/70/30 baseline (still weaker)
            stats: { hp: 350, atk: 50, def: 20, critChance: 0.05, critDamage: 1.50 },
            element: ELEMENTS.NEUTRAL,
            playableByPlayer: false, // Make Goblin playable for testing pool
            description: "A weak but annoying goblin."
        });

        this.skillMetadata = {
            skillPoke: { name: "Poke", description: "Deals minor damage.", type: 'active', cooldown: 0, targetType: 'enemy' }
        };
    }

    skillPoke(caster, targetTeam, ownTeam) {
        const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            SkillHelper.dealDamage(caster, target, 10, ELEMENTS.NEUTRAL); // Base damage 10
        } else {
            console.log(`${caster.getName()} used Poke, but no targets were available.`);
        }
    }
}

class OrcDefinition extends CharacterDefinition {
     constructor() {
        super({
            id: "orc",
            name: "Orc",
            // Adjusted stats closer to 500/70/30 baseline (tankier)
            stats: { hp: 600, atk: 70, def: 45, critChance: 0.10, critDamage: 1.60 },
            element: ELEMENTS.EARTH,
            playableByPlayer: false,
            description: "A brutish Orc."
        });

         this.skillMetadata = {
            skillHeavyStrike: { name: "Heavy Strike", description: "Deals significant Earth damage.", type: 'active', cooldown: 2, targetType: 'enemy' }
        };
    }

     skillHeavyStrike(caster, targetTeam, ownTeam) {
        const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            SkillHelper.dealDamage(caster, target, 70, ELEMENTS.EARTH); // Base damage 70
        } else {
            console.log(`${caster.getName()} used Heavy Strike, but no targets were available.`);
        }
    }
}

class WolfDefinition extends CharacterDefinition {
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
            skillBite: { name: "Bite", description: "Deals physical damage.", type: 'active', cooldown: 0, targetType: 'enemy' }
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

class WerewolfDefinition extends CharacterDefinition {
     constructor() {
        super({
            id: "werewolf",
            name: "Werewolf",
            // Adjusted stats closer to 500/70/30 baseline (stronger)
            stats: { hp: 550, atk: 80, def: 40, critChance: 0.15, critDamage: 1.70 },
            element: ELEMENTS.DARK,
            playableByPlayer: false,
            description: "A fearsome werewolf."
        });

         this.skillMetadata = {
            skillRavage: { name: "Ravage", description: "Deals heavy physical damage.", type: 'active', cooldown: 2, targetType: 'enemy' }
            // TODO: Add more skills?
        };
    }

     skillRavage(caster, targetTeam, ownTeam) {
        const livingTargets = targetTeam.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            SkillHelper.dealDamage(caster, target, 80, ELEMENTS.NEUTRAL); // Base damage 80
        } else {
            console.log(`${caster.getName()} used Ravage, but no targets were available.`);
        }
    }
}


// --- Definition Mapping ---

// Maps definition IDs to their corresponding classes
export const characterDefinitionClasses = {
    "katherine": KatherineDefinition,
    "goblin": GoblinDefinition,
    "orc": OrcDefinition,
    "wolf": WolfDefinition,
    "werewolf": WerewolfDefinition,
    "elzette": ElzetteDefinition // Added Elzette
    // Add other character definition classes here
    // "alina": AlinaDefinition,
    // ...etc
};

/**
 * Gets an INSTANCE of a character definition class by its ID.
 * @param {string} id - The character definition ID (e.g., "katherine").
 * @returns {CharacterDefinition | null} An instance of the definition class, or null if not found.
 */
export function getCharacterDefinition(id) {
    const DefinitionClass = characterDefinitionClasses[id.toLowerCase()];
    if (!DefinitionClass) {
        console.error(`Character definition class not found for ID: ${id}`);
        return null;
    }
    try {
        // Return a new instance of the definition class
        return new DefinitionClass();
    } catch (error) {
        console.error(`Error instantiating character definition for ID ${id}:`, error);
        return null;
    }
}
