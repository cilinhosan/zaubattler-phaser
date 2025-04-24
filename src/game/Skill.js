import { v4 as uuidv4 } from 'uuid';

/**
 * Base class for all skills.
 */
class Skill {
    constructor(skillId, name, description, icon, skillType, effectFn) {
        if (this.constructor === Skill) {
            throw new Error("Cannot instantiate abstract class Skill directly.");
        }
        this.id = uuidv4(); // Unique instance ID for the skill
        this.skillId = skillId; // Game-defined ID for this type of skill
        this.name = name;
        this.description = description;
        this.icon = icon; // Path to icon asset
        this.skillType = skillType; // 'active' or 'passive'
        this.ownerCharacter = null; // Will be set when added to a character

        // The core function defining the skill's behavior
        // Receives: (caster, targetTeam, casterTeam)
        this.effect = effectFn;

        // --- Flags for specific passive behaviors ---
        this.applyImmediately = false; // Apply effect as soon as added? (for passives)
        this.applyOnReset = false;     // Re-apply effect on combat reset? (for passives)
        this.modifiesStats = false;    // Does this passive modify base/current stats?
    }

    // Placeholder for execution logic, overridden by subclasses if needed
    execute(targetTeam, casterTeam) {
        if (!this.ownerCharacter) {
            console.error(`Skill ${this.name} has no owner!`);
            return;
        }
        console.log(`${this.ownerCharacter.name} uses ${this.name}!`);
        this.applyEffect(this.ownerCharacter, targetTeam, casterTeam);
    }

    // Wrapper to call the effect function
    applyEffect(caster, targetTeam, casterTeam) {
         if (typeof this.effect === 'function') {
             this.effect(caster, targetTeam, casterTeam);
         } else {
             console.error(`Effect for skill ${this.name} is not a function!`);
         }
    }
}

/**
 * Represents an active skill that characters can use during their turn.
 */
class ActiveSkill extends Skill {
    constructor(skillId, name, description, icon, cooldown, effectFn) {
        super(skillId, name, description, icon, 'active', effectFn);
        this.baseCooldown = cooldown; // The cooldown duration in turns
        this.currentCooldown = 0; // Turns remaining until usable (0 means usable)
    }

    isUsable() {
        return this.currentCooldown <= 0;
    }

    // Called when the skill is used
    triggerCooldown() {
        this.currentCooldown = this.baseCooldown;
    }

    // Called at the end of the character's turn (or start of next turn)
    tickCooldown() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }

    // Reset cooldown at the start/end of battle
    resetCooldown() {
        this.currentCooldown = 0;
    }

    // // Override execute to handle cooldown triggering - // NOTE: This is likely bypassed now by determineAction logic
    // execute(targetTeam, casterTeam) {
    //     if (!this.ownerCharacter) {
    //          console.error(`Skill ${this.name} has no owner!`);
    //          return;
    //     }
    //     if (!this.isUsable()) { // This check is now done in determineAction
    //         console.log(`${this.ownerCharacter.name} tries to use ${this.name}, but it's on cooldown (${this.currentCooldown} turns left).`);
    //         return;
    //     }
    //
    //     console.log(`${this.ownerCharacter.name} uses ${this.name}!`); // Logging moved to the action's execute
    //     this.applyEffect(this.ownerCharacter, targetTeam, casterTeam);
    //     this.triggerCooldown(); // Cooldown trigger moved to the action's execute
    // }

    // Provide an action object for the battle system, called by determineAction
    getAction(targetTeam, casterTeam) { // Accept teams if needed for targeting logic *before* execution (though effectFn handles actual targeting)
        // The execute function here IS the action.
        return {
            name: this.name,
            skill: this, // Reference to the skill itself
            execute: () => { // This function is called by the battle loop
                 if (!this.ownerCharacter) {
                     console.error(`Skill ${this.name} cannot execute without an owner!`);
                     return;
                 }
                 // Note: isUsable() check is done *before* getAction is called in determineAction

                 console.log(`${this.ownerCharacter.name} uses skill: ${this.name}!`);

                 // Apply the actual skill effect
                 // We need both targetTeam and casterTeam for the effect function signature
                 // We assume casterTeam can be derived if needed within the effect or passed by the battle manager later
                 this.applyEffect(this.ownerCharacter, targetTeam, casterTeam); // Pass necessary context

                 // Trigger the cooldown AFTER the effect is applied
                 this.triggerCooldown();
            }
        };
    }
}

/**
 * Represents a passive skill that provides ongoing effects or triggers automatically.
 */
class PassiveSkill extends Skill {
    constructor(skillId, name, description, icon, effectFn, options = {}) {
        super(skillId, name, description, icon, 'passive', effectFn);
        // Apply options flags
        this.applyImmediately = options.applyImmediately ?? false;
        this.applyOnReset = options.applyOnReset ?? this.applyImmediately; // Default to re-applying if applied immediately
        this.modifiesStats = options.modifiesStats ?? false;
    }

    // Passive skills don't have a standard 'execute' action from the menu,
    // their effects are applied automatically or trigger based on game events.
    // The base 'applyEffect' method is used when needed (e.g., on add, on reset).
}

export { Skill, ActiveSkill, PassiveSkill };