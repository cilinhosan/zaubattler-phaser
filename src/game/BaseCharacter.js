// src/game/BaseCharacter.js
import { v4 as uuidv4 } from 'uuid';
import { getCharacterDefinition } from '../CharacterDefinitionList.js'; // Adjusted path

/**
 * Represents the fundamental properties of a character, derived from its definition.
 * This class serves as the base for more specialized character classes like
 * BattleCharacter and MenuCharacter.
 */
export class BaseCharacter {
    constructor(definitionId, level = 1) {
        const definition = getCharacterDefinition(definitionId);
        if (!definition) {
            // Throw an error if the definition doesn't exist to prevent invalid characters
            throw new Error(`Failed to create character: Definition not found for ID "${definitionId}"`);
        }

        this.definition = definition; // <-- STORE THE DEFINITION OBJECT
        this.id = uuidv4(); // Unique identifier for this specific character instance
        this.definitionId = definitionId; // Store the ID used to create it (e.g., "katherine")
        this.name = definition.name;
        this.level = level;
        this.faction = definition.faction;

        // Store base stats directly from definition - use spread for a shallow copy
        // These represent the character's stats at level 1, before any modifications.
        this.baseStats = { ...definition.stats };

        // Skill logic is now part of the definition instance itself.
        // this.skillDefinitionIds = [...definition.skillIds]; // Removed

        // Store other potentially useful definition data
        this.playableByPlayer = definition.playableByPlayer;
        this.description = definition.description;
        // this.spriteKey = definition.spriteKey; // Removed sprite key per feedback
    }

    /**
     * Gets a base stat value by name.
     * @param {string} statName - The name of the stat (e.g., 'hp', 'atk', 'def').
     * @returns {number} The base value of the stat, or 0 if not found.
     */
    getBaseStat(statName) {
        return this.baseStats[statName.toLowerCase()] ?? 0;
    }

    /**
     * Gets the character's name.
     * @returns {string}
     */
    getName() {
        return this.name;
    }

    /**
     * Gets the character's current level.
     * @returns {number}
     */
    getLevel() {
        return this.level;
    }

    /**
     * Gets the character's faction.
     * @returns {string} The faction (e.g., 'Crimson', 'Azure'). See FACTION in BaseDefinitions.js.
     */
    getFaction() {
        return this.faction;
    }

     /**
     * Gets the character's unique instance ID.
     * @returns {string}
     */
     getId() {
        return this.id;
    }

    /**
     * Gets the ID of the definition this character was created from.
     * @returns {string}
     */
    getDefinitionId() {
        return this.definitionId;
    }

    // Removed getSkillDefinitionIds as skills are handled differently now.
    // /**
    //  * Gets the list of skill definition IDs associated with this character.
    //  * @returns {string[]}
    //  */
    // getSkillDefinitionIds() {
    //     return [...this.skillDefinitionIds]; // Return a copy
    // }
}

export default BaseCharacter;