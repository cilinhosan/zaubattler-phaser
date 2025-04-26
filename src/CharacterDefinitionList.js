// src/CharacterDefinitionList.js
// This file now acts as an index for character definitions.

import { KatherineDefinition } from './character_definitions/KatherineDefinition.js';
import { ElzetteDefinition } from './character_definitions/ElzetteDefinition.js';
import { GoblinDefinition } from './character_definitions/GoblinDefinition.js';
import { OrcDefinition } from './character_definitions/OrcDefinition.js';
import { WolfDefinition } from './character_definitions/WolfDefinition.js';
import { WerewolfDefinition } from './character_definitions/WerewolfDefinition.js';

// Re-export ELEMENTS from BaseDefinitions for convenience if needed elsewhere,
// or components can import directly from BaseDefinitions.js
export { FACTION } from './character_definitions/BaseDefinitions.js';

// Maps definition IDs to their corresponding classes
export const characterDefinitionClasses = {
    "katherine": KatherineDefinition,
    "goblin": GoblinDefinition,
    "orc": OrcDefinition,
    "wolf": WolfDefinition,
    "werewolf": WerewolfDefinition,
    "elzette": ElzetteDefinition
    // Add other character definition classes here by importing them
    // "alina": AlinaDefinition,
    // ...etc
};

/**
 * Gets an INSTANCE of a character definition class by its ID.
 * @param {string} id - The character definition ID (e.g., "katherine").
 * @returns {import('./character_definitions/BaseDefinitions.js').CharacterDefinition | null} An instance of the definition class, or null if not found.
 */
export function getCharacterDefinition(id) {
    const DefinitionClass = characterDefinitionClasses[id?.toLowerCase()]; // Added optional chaining for safety
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
