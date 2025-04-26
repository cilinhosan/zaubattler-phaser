// src/game/starterCharacterPool.js

import MenuCharacter from './MenuCharacter.js';
// Import the map of definition classes and the getter function
import { characterDefinitionClasses, getCharacterDefinition } from '../CharacterDefinitionList.js';

// Create the pool of player-usable characters based on definitions
// Store only the IDs of playable character definitions
const playableCharacterDefinitionIds = [];

// Populate the list of playable IDs from definition classes
for (const definitionId in characterDefinitionClasses) {
    const definitionInstance = getCharacterDefinition(definitionId); // Get instance to check properties
    if (definitionInstance && definitionInstance.playableByPlayer) {
        playableCharacterDefinitionIds.push(definitionId);
        console.log(`Added playable definition ID '${definitionId}' (${definitionInstance.name}) to starter pool.`);
    } else if (!definitionInstance) {
        console.warn(`Could not get definition instance for ID ${definitionId} while building starter pool ID list.`);
    }
}

if (playableCharacterDefinitionIds.length === 0) {
    console.warn("Starter character pool (IDs) is empty! Check characterDefinitions.");
}

/**
 * Gets a specified number of unique random characters by creating new instances.
 * @param {number} count - The number of unique characters to retrieve.
 * @returns {MenuCharacter[]} An array of unique MenuCharacter instances, or fewer if the pool is smaller than count.
 */
export function getRandomCharacters(count) {
    if (count <= 0) {
        return [];
    }

    // Shuffle the available definition IDs
    const shuffledIds = [...playableCharacterDefinitionIds].sort(() => 0.5 - Math.random());

    // Take the required number of unique IDs (or all if count is too high)
    const selectedIds = shuffledIds.slice(0, Math.min(count, shuffledIds.length));

    // Create NEW MenuCharacter instances for the selected IDs
    const characters = selectedIds.map(id => {
        try {
            return new MenuCharacter(id, 1); // Create instance here, ensuring latest definition is fetched
        } catch (error) {
            console.error(`Failed to create MenuCharacter for ID '${id}' in getRandomCharacters:`, error);
            return null; // Return null if creation fails
        }
    }).filter(char => char !== null); // Filter out any nulls from creation errors

    return characters;
}

/**
 * Gets the complete pool of playable characters as NEW instances.
 * Use this if you need to display all available characters.
 * @returns {MenuCharacter[]} An array of new MenuCharacter instances for all playable definitions.
 */
export function getPlayerCharacterPool() {
    // Create NEW instances every time the full pool is requested
    return playableCharacterDefinitionIds.map(id => {
         try {
            return new MenuCharacter(id, 1);
        } catch (error) {
            console.error(`Failed to create MenuCharacter for ID '${id}' in getPlayerCharacterPool:`, error);
            return null;
        }
    }).filter(char => char !== null);
}

// Optional: Default export could be the function to get the whole pool
// export default getPlayerCharacterPool;

// Note: The original export was createCharacterPool which returned the array.
// The new structure initializes the pool on import and exports functions to access it.
// Adjust imports elsewhere if they relied on calling createCharacterPool().