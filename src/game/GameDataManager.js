/**
 * Manages global game state like player inventory and team composition.
 * Uses a singleton pattern.
 */
class GameDataManager {
    constructor() {
        if (GameDataManager.instance) {
            return GameDataManager.instance;
        }
        this.tickets = 0; // Player currency
        this.characterInventory = []; // Array holding MenuCharacter data objects (player's recruited characters)
        // Array representing 5 team slots, holding references to characterInventory objects or null
        this.teamSlots = [null, null, null, null, null];
        this.currentBattleIndex = 0; // Track the current battle

        // --- Properties to hold prepared teams for the upcoming battle ---
        this.currentBattlePlayerTeam = null; // Array of BattleCharacter instances
        this.currentBattleEnemyTeam = null; // Array of BattleCharacter instances
        this.lastBattleResult = null; // Stores the outcome of the last battle { won: boolean }

        GameDataManager.instance = this;
        console.log("GameDataManager initialized.");
    }

    // --- Ticket Methods ---

    addTickets(amount) {
        if (amount > 0) {
            this.tickets += amount;
            console.log(`GameDataManager: Added ${amount} tickets. Total: ${this.tickets}`);
        } else {
            console.warn(`GameDataManager: Attempted to add invalid ticket amount: ${amount}`);
        }
    }

    spendTickets(amount) {
        if (amount <= 0) {
            console.warn(`GameDataManager: Attempted to spend invalid ticket amount: ${amount}`);
            return false;
        }
        if (this.tickets >= amount) {
            this.tickets -= amount;
            console.log(`GameDataManager: Spent ${amount} tickets. Remaining: ${this.tickets}`);
            return true;
        } else {
            console.log(`GameDataManager: Not enough tickets to spend ${amount}. Current: ${this.tickets}`);
            return false;
        }
    }

    getTickets() {
        return this.tickets;
    }

    // --- Character Inventory Methods ---

    initializeCharacterInventory(initialCharacters) {
        if (this.characterInventory.length > 0) {
            console.warn("GameDataManager: Attempting to re-initialize character inventory. Ignoring.");
            return;
        }
        this.characterInventory = initialCharacters || [];
        console.log(`GameDataManager: Character inventory initialized with ${this.characterInventory.length} characters.`);
        // Clear team slots when inventory is reset to ensure consistency
        this.teamSlots = [null, null, null, null, null];
    }

    /**
     * Adds a character to the player's inventory.
     * @param {object} characterData - The MenuCharacter data object.
     */
    addCharacterToInventory(characterData) {
        if (!characterData || !characterData.id) {
            console.error("GameDataManager: Attempted to add invalid character data to inventory.", characterData);
            return;
        }
        // Optional: Check if character already exists by ID to prevent duplicates
        if (this.findCharacterInInventoryById(characterData.id)) {
             console.warn(`GameDataManager: Character with ID ${characterData.id} already exists in inventory. Skipping add.`);
             return;
        }
        this.characterInventory.push(characterData);
        console.log(`GameDataManager: Added character ${characterData.name} (ID: ${characterData.id}) to inventory.`);
    }

    /**
     * Gets the list of characters the player has recruited (the inventory).
     * @returns {Array} A shallow copy of the character inventory.
     */
    getCharacterInventory() {
        return [...this.characterInventory]; // Return shallow copy
    }

    /**
     * Finds a character in the character inventory by its unique ID.
     * @param {string} characterId - The unique ID of the character.
     * @returns {object | undefined} The character data object if found, otherwise undefined.
     */
    findCharacterInInventoryById(characterId) {
        return this.characterInventory.find(char => char && char.id === characterId);
    }


    // --- Team Methods ---

    /**
     * Sets the initial team composition, called once from MenuScreenScene.
     * Ensures characters exist in the inventory.
     * @param {Array} initialTeamData - Array of character data objects.
     */
    initializeTeam(initialTeamData) {
        this.teamSlots = [null, null, null, null, null]; // Clear existing
        if (initialTeamData && Array.isArray(initialTeamData)) {
            initialTeamData.forEach((charData, index) => {
                if (index < this.teamSlots.length && charData) {
                    const inventoryChar = this.findCharacterInInventoryById(charData.id);
                    if (inventoryChar) {
                        this.teamSlots[index] = inventoryChar; // Store reference from characterInventory
                    } else {
                        console.warn(`GameDataManager: Character ${charData.name} (ID: ${charData.id}) from initial team not found in character inventory. Skipping.`);
                    }
                }
            });
            console.log(`GameDataManager: Initial team set in slots:`, this.teamSlots.map(c => c?.name || 'Empty'));
        }
    }

    /**
     * Updates the stored team composition. Called by PreBattleSetupScene before transitioning.
     * @param {Array} finalTeamSlotData - The array representing the final state of team slots
     *                                    (containing character data objects or null).
     */
    updateTeam(finalTeamSlotData) {
        if (!Array.isArray(finalTeamSlotData) || finalTeamSlotData.length !== this.teamSlots.length) {
            console.error("GameDataManager: updateTeam called with invalid data format.");
            return;
        }

        // Validate and store references from the main inventory
        this.teamSlots = finalTeamSlotData.map((charData, index) => {
            if (charData) {
                const inventoryChar = this.findCharacterInInventoryById(charData.id);
                if (inventoryChar) {
                    return inventoryChar; // Store the characterInventory reference
                } else {
                    console.warn(`GameDataManager: Character ${charData.name} (ID: ${charData.id}) in final team slot ${index} not found in character inventory. Slot cleared.`);
                    return null; // Character doesn't exist in characterInventory, clear slot
                }
            }
            return null; // Slot was empty
        });
        console.log(`GameDataManager: Team updated:`, this.teamSlots.map(c => c?.name || 'Empty'));
    }

    /**
     * Gets the current team composition (characters in slots).
     * @returns {Array} Array of character data objects (references from inventory) or nulls.
     */
    getTeamSlots() {
        // Return shallow copy of the array, containing references or nulls
        return [...this.teamSlots];
    }

    /**
     * Gets the current team as a filtered array (only characters, no nulls).
     * @returns {Array} Array of character data objects currently in the team.
     */
    getActiveTeam() {
        return this.teamSlots.filter(charData => charData !== null);
    }

     /**
     * Checks if a character (by data object) is currently in any team slot.
     * @param {object} characterData - The character data object to check.
     * @returns {boolean} True if the character is in the team, false otherwise.
     */
    isCharacterInTeam(characterData) {
        if (!characterData || !characterData.id) return false;
        return this.teamSlots.some(slotChar => slotChar && slotChar.id === characterData.id);
    }

    // --- Battle Index Methods ---

    getCurrentBattleIndex() {
        return this.currentBattleIndex;
    }

    incrementBattleIndex() {
        this.currentBattleIndex++;
        console.log(`GameDataManager: Battle index incremented to ${this.currentBattleIndex}`);
    }

    // --- Battle Team Preparation ---
    setCurrentBattlePlayerTeam(team) {
        console.log("[GameDataManager] Setting current battle player team:", team?.map(c => c.name));
        this.currentBattlePlayerTeam = team;
    }

    getCurrentBattlePlayerTeam() {
        // console.log("[GameDataManager] Getting current battle player team:", this.currentBattlePlayerTeam?.map(c => c.name));
        return this.currentBattlePlayerTeam;
    }

    setCurrentBattleEnemyTeam(team) {
        console.log("[GameDataManager] Setting current battle enemy team:", team?.map(c => c.name));
        this.currentBattleEnemyTeam = team;
    }

    getCurrentBattleEnemyTeam() {
        // console.log("[GameDataManager] Getting current battle enemy team:", this.currentBattleEnemyTeam?.map(c => c.name));
        return this.currentBattleEnemyTeam;
    }

    // --- Battle Result Methods ---
    setLastBattleResult(result) {
        // Expects result to be an object like { won: true } or { won: false }
        if (result && typeof result.won === 'boolean') {
            this.lastBattleResult = result;
            console.log(`[GameDataManager] Last battle result set:`, this.lastBattleResult);
        } else {
            console.warn("[GameDataManager] Attempted to set invalid battle result:", result);
            this.lastBattleResult = null; // Clear if invalid
        }
    }

    getLastBattleResult() {
        // console.log("[GameDataManager] Getting last battle result:", this.lastBattleResult);
        return this.lastBattleResult;
    }

    /**
     * Resets the inventory, team slots, and battle index to their initial state.
     * Should be called when starting a new game or returning to the main menu.
     */
    reset() {
        this.tickets = 0;
        this.characterInventory = [];
        this.teamSlots = [null, null, null, null, null];
        this.currentBattleIndex = 0; // Reset battle index as well
        // Also clear prepared battle teams
        this.currentBattlePlayerTeam = null;
        this.currentBattleEnemyTeam = null;
        this.lastBattleResult = null; // Also clear the last battle result
        console.log("GameDataManager: State reset (tickets, character inventory, team, battle index, prepared teams, and last battle result cleared).");
    }
}

// Create and export the singleton instance
const instance = new GameDataManager();
export default instance;