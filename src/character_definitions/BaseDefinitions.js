// src/character_definitions/BaseDefinitions.js

// Define Elements using a constant object
export const FACTION = Object.freeze({
    LIGHT: 'Light',
    CRIMSON: 'Crimson',
    EMERALD: 'Emerald',
    AZURE: 'Azure',
    SEPIA: 'Sepia',
    DARK: 'Dark',
    NEUTRAL: 'Neutral'
});

/**
 * Base class for all character definitions.
 * Contains common properties and structure.
 */
export class CharacterDefinition {
    constructor({
        id, name, stats, faction, playableByPlayer = false, description = "",
        faceIconKey, faceIconPath, battleIconKey, battleIconPath,
        landscapeIllustrationKey, landscapeIllustrationPath // Added landscape illustration properties
    }) {
        if (!id || !name || !stats || !faction) {
            throw new Error("Missing required fields for CharacterDefinition: id, name, stats, faction");
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
        this.faction = faction;
        this.playableByPlayer = playableByPlayer;
        this.description = description;

        // Assign icon properties (provide defaults if necessary, though subclasses should define them)
        this.faceIconKey = faceIconKey || 'default_character_icon';
        this.faceIconPath = faceIconPath || 'assets/default_character_ilustration_face_icon.png';
        this.battleIconKey = battleIconKey || 'default_battle_icon';
        this.battleIconPath = battleIconPath || 'assets/default_character_ilustration_4_3.png';
        this.landscapeIllustrationKey = landscapeIllustrationKey || 'defaultLandscapeIllustration'; // Added
        this.landscapeIllustrationPath = landscapeIllustrationPath || 'assets/default_character_illustration_landscape.jpg'; // Added

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