// src/game/MenuCharacter.js
import BaseCharacter from './BaseCharacter.js';
// LLM TODO: Import necessary UI or Scene components if MenuCharacter interacts directly with them.

/**
 * Represents a character within the context of a menu or pre-battle setup screen.
 * Handles properties related to team formation, display in lists, etc.
 * Does not contain battle-specific logic like HP or combat actions.
 */
export class MenuCharacter extends BaseCharacter {
    constructor(definitionId, level = 1) {
        super(definitionId, level); // Call BaseCharacter constructor

        // --- Menu/Setup Specific Properties ---
        this.assignedSlot = null; // e.g., 'front1', 'back2', or null if in reserve pool
        this.isInActiveTeam = false; // Tracks if the character is currently placed in the active team slots
        this.isSelected = false; // For UI interactions, like showing details on click/hover
        this.isDraggable = true; // Can this character be dragged in the UI?

        // Reference to its UI representation in the menu (e.g., a card, an icon)
        // This would likely be a Phaser GameObject or a custom UI element instance.
        this.menuDisplay = null; // To be set externally

        // LLM TODO: Add any other properties needed for menu interactions,
        // e.g., equipment slots, temporary boosts selected in the menu.
    }

    // --- Menu Interaction Methods ---

    /**
     * Assigns the character to a specific team slot.
     * @param {string | null} slotId - The ID of the slot (e.g., "front1") or null to unassign.
     */
    assignToSlot(slotId) {
        this.assignedSlot = slotId;
        this.isInActiveTeam = slotId !== null;
        console.log(`${this.name} assigned to slot: ${slotId}`);
        // LLM TODO: Update UI representation (this.menuDisplay) if it exists.
        if (this.menuDisplay) {
            // Example: this.menuDisplay.updateSlotPosition(slotId);
        }
    }

    /**
     * Marks the character as selected (e.g., for showing details).
     * @param {boolean} selected - True if selected, false otherwise.
     */
    setSelected(selected) {
        this.isSelected = selected;
        // LLM TODO: Update UI representation (e.g., highlight border).
        if (this.menuDisplay) {
            // Example: this.menuDisplay.setHighlight(selected);
        }
    }

    /**
     * Sets the draggable state of the character in the menu.
     * @param {boolean} draggable - True if draggable, false otherwise.
     */
    setDraggable(draggable) {
        this.isDraggable = draggable;
         // LLM TODO: Update UI representation (e.g., enable/disable drag input).
         if (this.menuDisplay) {
            // Example: this.menuDisplay.setDragState(draggable);
        }
    }

    // --- Getters for Menu State ---

    /**
     * Gets the slot ID the character is currently assigned to.
     * @returns {string | null}
     */
    getAssignedSlot() {
        return this.assignedSlot;
    }

    /**
     * Checks if the character is currently part of the active team formation.
     * @returns {boolean}
     */
    isAssignedToTeam() {
        return this.isInActiveTeam;
    }

    /**
     * Checks if the character is currently selected in the UI.
     * @returns {boolean}
     */
    getIsSelected() {
        return this.isSelected;
    }

    /**
     * Checks if the character can be dragged in the UI.
     * @returns {boolean}
     */
    getIsDraggable() {
        return this.isDraggable;
    }

    // LLM TODO: Add methods for equipping items, viewing detailed stats/skills
    // in the menu context if needed.
}

export default MenuCharacter;