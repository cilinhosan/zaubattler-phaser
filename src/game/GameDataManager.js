/**
 * Manages global game state like player inventory and team composition.
 * Uses a singleton pattern.
 */
class GameDataManager {
    constructor() {
        if (GameDataManager.instance) {
            return GameDataManager.instance;
        }
        this.inventory = []; // Array holding MenuCharacter data objects
        // Array representing 5 team slots, holding references to inventory character objects or null
        this.teamSlots = [null, null, null, null, null];
        GameDataManager.instance = this;
        console.log("GameDataManager initialized.");
    }

    // --- Inventory Methods ---

    initializeInventory(initialInventory) {
        if (this.inventory.length > 0) {
            console.warn("GameDataManager: Attempting to re-initialize inventory. Ignoring.");
            return;
        }
        this.inventory = initialInventory || [];
        console.log(`GameDataManager: Inventory initialized with ${this.inventory.length} characters.`);
        // Clear team slots when inventory is reset to ensure consistency
        this.teamSlots = [null, null, null, null, null];
    }

    getInventory() {
        return [...this.inventory]; // Return shallow copy
    }

    findInventoryCharacterById(characterId) {
        return this.inventory.find(char => char && char.id === characterId);
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
                    const inventoryChar = this.findInventoryCharacterById(charData.id);
                    if (inventoryChar) {
                        this.teamSlots[index] = inventoryChar; // Store reference from inventory
                    } else {
                        console.warn(`GameDataManager: Character ${charData.name} (ID: ${charData.id}) from initial team not found in inventory. Skipping.`);
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
                const inventoryChar = this.findInventoryCharacterById(charData.id);
                if (inventoryChar) {
                    return inventoryChar; // Store the inventory reference
                } else {
                    console.warn(`GameDataManager: Character ${charData.name} (ID: ${charData.id}) in final team slot ${index} not found in inventory. Slot cleared.`);
                    return null; // Character doesn't exist in inventory, clear slot
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

    /**
     * Resets the inventory and team slots to their initial empty state.
     * Should be called when returning to the main menu after a game ends.
     */
    reset() {
        this.inventory = [];
        this.teamSlots = [null, null, null, null, null];
        console.log("GameDataManager: State reset (inventory and team cleared).");
    }
}

// Create and export the singleton instance
const instance = new GameDataManager();
export default instance;