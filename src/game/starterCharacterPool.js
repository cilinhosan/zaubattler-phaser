// src/game/starterCharacterPool.js

import MenuCharacter from './MenuCharacter.js';
// Import the map of definition classes and the getter function
import { characterDefinitionClasses, getCharacterDefinition } from '../CharacterDefinitionList.js';

// Create the pool of player-usable characters based on definitions
const playerCharacterPool = [];

// Populate the pool from definition classes
for (const definitionId in characterDefinitionClasses) {
    // Get an instance of the definition to check its properties
    const definitionInstance = getCharacterDefinition(definitionId);
    if (definitionInstance && definitionInstance.playableByPlayer) {
        // Create a MenuCharacter instance for each playable definition
        // We assume level 1 for the initial pool characters
        const menuCharacter = new MenuCharacter(definitionId, 1);
        playerCharacterPool.push(menuCharacter);
        console.log(`Added ${menuCharacter.getName()} to starter pool.`);
    } else if (!definitionInstance) {
        console.warn(`Could not get definition instance for ID ${definitionId} while building starter pool.`);
    }
}

if (playerCharacterPool.length === 0) {
    console.warn("Starter character pool is empty! Check characterDefinitions.");
}

/**
 * Gets a specified number of unique random characters from the player pool.
 * @param {number} count - The number of unique characters to retrieve.
 * @returns {MenuCharacter[]} An array of unique MenuCharacter instances, or fewer if the pool is smaller than count.
 */
export function getRandomCharacters(count) {
    if (count <= 0) {
        return [];
    }
    if (count >= playerCharacterPool.length) {
        // If requesting more or equal to the pool size, return a shuffled copy of the whole pool
        return [...playerCharacterPool].sort(() => 0.5 - Math.random());
    }

    const shuffledPool = [...playerCharacterPool].sort(() => 0.5 - Math.random());
    return shuffledPool.slice(0, count);
}

/**
 * Gets the complete pool of playable characters.
 * Use this if you need to display all available characters.
 * @returns {MenuCharacter[]} A shallow copy of the player character pool.
 */
export function getPlayerCharacterPool() {
    // Return a shallow copy to prevent external modification of the original pool
    return [...playerCharacterPool];
}

// Optional: Default export could be the function to get the whole pool
// export default getPlayerCharacterPool;

// Note: The original export was createCharacterPool which returned the array.
// The new structure initializes the pool on import and exports functions to access it.
// Adjust imports elsewhere if they relied on calling createCharacterPool().