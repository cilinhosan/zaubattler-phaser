// src/game/AttachedEffect.js
import { v4 as uuidv4 } from 'uuid';

/**
 * Base class for effects that can be attached to a character,
 * providing hooks for various battle events.
 */
class AttachedEffect {
    /**
     * @param {object} config - Configuration for the effect.
     * @param {BattleCharacter} config.owner - The character this effect is attached to.
     * @param {string} config.type - A string identifier for the type of effect (e.g., 'buff_atk', 'poison', 'thorns').
     * @param {number} [config.duration=Infinity] - How many global turns this effect lasts. Infinity for permanent.
     * @param {string} [config.sourceSkillId=null] - The ID of the skill that applied this effect.
     * @param {object} [config.state={}] - Custom state for this effect instance.
     * @param {boolean} [config.isBuff=true] - Whether this effect is generally considered a buff (for UI, dispelling).
     * @param {boolean} [config.isHidden=false] - Whether this effect should be hidden from UI.
     * @param {string} [config.name='Effect'] - Display name for the effect.
     * @param {string} [config.description=''] - Description of the effect.
     * @param {string} [config.icon=null] - Icon key for the effect.
     */
    constructor({
        owner,
        type,
        duration = Infinity,
        sourceSkillId = null,
        state = {},
        isBuff = true,
        isHidden = false,
        name = 'Effect',
        description = '',
        icon = null
    }) {
        if (!owner) {
            throw new Error("AttachedEffect requires an 'owner' (BattleCharacter).");
        }
        if (!type) {
            throw new Error("AttachedEffect requires a 'type'.");
        }
        this.id = uuidv4(); // Unique instance ID
        this.owner = owner;
        this.type = type;
        this.duration = duration; // Duration in global turns
        this.initialDuration = duration; // Store initial duration for reference
        this.sourceSkillId = sourceSkillId;
        this.state = { ...state }; // Custom state for the effect instance
        this.isBuff = isBuff;
        this.isHidden = isHidden;
        this.name = name;
        this.description = description;
        this.icon = icon;

        this.isActive = true; // Becomes false when duration runs out or removed
    }

    /**
     * Called when the effect is first applied to the owner.
     * @param {object} context - The battle context.
     * @param {BattleScene} context.scene - The current BattleScene.
     * @param {BattleCharacter} context.owner - The character this effect is attached to.
     */
    onApply(context) {
        // console.log(`${this.owner.name} received effect: ${this.name} (Type: ${this.type})`);
    }

    /**
     * Called when the effect expires or is removed.
     * @param {object} context - The battle context.
     */
    onExpire(context) {
        // console.log(`Effect ${this.name} (Type: ${this.type}) expired on ${this.owner.name}`);
        this.isActive = false;
    }

    /**
     * Called at the start of each global turn, for all characters.
     * This is where duration is typically decremented by BattleCharacter.processGlobalTurnStart.
     * @param {object} context - The battle context.
     * @param {number} currentGlobalTurn - The current global turn number.
     */
    onGlobalTurnStart(context, currentGlobalTurn) {}

    /**
     * Called at the end of each global turn, for all characters.
     * @param {object} context - The battle context.
     * @param {number} currentGlobalTurn - The current global turn number.
     */
    onGlobalTurnEnd(context, currentGlobalTurn) {}
    
    /**
     * Called at the start of the owner's individual action phase.
     * @param {object} context - The battle context.
     * @param {number} currentGlobalTurn - The current global turn number (for context).
     */
    onActionPhaseStart(context, currentGlobalTurn) {}

    /**
     * Called at the end of the owner's individual action phase.
     * @param {object} context - The battle context.
     * @param {number} currentGlobalTurn - The current global turn number (for context).
     */
    onActionPhaseEnd(context, currentGlobalTurn) {}


    /**
     * Called by BattleCharacter.processGlobalTurnStart to decrement duration.
     * @param {number} currentGlobalTurn - The current global turn number.
     * @returns {boolean} - Return true if the effect should be removed (duration expired).
     */
    tickDuration(currentGlobalTurn) {
        if (!this.isActive) return false; // Already expired or removed
        if (this.duration === Infinity) {
            return false; // Permanent effect
        }
        this.duration--;
        // console.log(`Effect ${this.name} on ${this.owner.name} duration: ${this.duration}`);
        if (this.duration <= 0) {
            this.isActive = false; // Mark as inactive, onExpire will be called by BattleCharacter
            return true; // Signal to remove
        }
        return false; // Keep active
    }

    /**
     * Called by BattleCharacter.processGlobalTurnStart for periodic effects (e.g., DoT, HoT)
     * AFTER tickDuration. This should NOT manage its own duration decrementing.
     * @param {object} context - The battle context.
     * @returns {boolean} - Return true if the effect should be removed (e.g., consumed after ticking).
     */
    onTick(context) {
        // Example: A one-time tick effect might return true here after doing its job.
        // Most DoTs/HoTs will return false and rely on tickDuration for expiration.
        return false; 
    }


    /**
     * Called before the owner executes an action.
     * Can be used to modify the action or owner's stats temporarily.
     * @param {object} context - The battle context.
     * @param {object} action - The action object about to be executed.
     */
    beforeAction(context, action) {}

    /**
     * Called after the owner executes an action.
     * @param {object} context - The battle context.
     * @param {object} action - The action object that was executed.
     * @param {Array<BattleCharacter>} targets - The targets of the action.
     */
    afterAction(context, action, targets) {}

    /**
     * Called when the owner takes damage.
     * Can modify incoming damage or trigger reactive effects.
     * @param {object} context - The battle context.
     * @param {object} damageInfo - Information about the incoming damage.
     * @returns {object} Potentially modified damageInfo.
     */
    onDamageTaken(context, damageInfo) {
        return damageInfo;
    }

    /**
     * Called when the owner deals damage.
     * Can modify outgoing damage or trigger effects on hit.
     * @param {object} context - The battle context.
     * @param {BattleCharacter} target - The character receiving the damage.
     * @param {object} damageInfo - Information about the outgoing damage.
     * @returns {object} Potentially modified damageInfo.
     */
    onDealingDamage(context, target, damageInfo) {
        return damageInfo;
    }

    /**
     * Called when another character in the battle is defeated.
     * @param {object} context - The battle context.
     * @param {BattleCharacter} defeatedCharacter - The character that was defeated.
     */
    onCharacterDefeated(context, defeatedCharacter) {}

    /**
     * Utility to refresh duration.
     * @param {number} newDuration - Optional new duration. If not provided, resets to initialDuration.
     */
    refreshDuration(newDuration) {
        this.duration = newDuration !== undefined ? newDuration : this.initialDuration;
        this.isActive = true; // Ensure it's active if refreshed
        // console.log(`Effect ${this.name} on ${this.owner.name} refreshed to ${this.duration} turns.`);
    }

    /**
     * Forcibly removes the effect.
     * @param {object} context - The battle context.
     */
    remove(context) {
        this.onExpire(context); // Call expire logic
        // The actual removal from the owner's list is handled by BattleCharacter
    }
}

export default AttachedEffect;