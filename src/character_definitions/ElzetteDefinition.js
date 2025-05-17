// src/character_definitions/ElzetteDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';
import AttachedEffect from '../game/AttachedEffect.js'; // Import base class

// --- Define a specific effect for Heart of Light ---
class HeartOfLightEffect extends AttachedEffect {
    constructor({ owner, sourceSkillId, attackBonus }) {
        super({
            owner,
            type: 'passive_atk_boost_elzette', // Unique type
            duration: Infinity,
            sourceSkillId,
            name: 'Heart of Light',
            description: `Increases ATK by ${attackBonus}.`,
            isBuff: true,
            isHidden: false, // Or true if you don't want to show it in UI
        });
        this.attackBonus = attackBonus;
        this.applied = false; // To ensure it applies only once
    }

    onApply(context) {
        super.onApply(context);
        if (!this.applied) {
            // Modify the owner's stat directly.
            // For more complex stat mods, BattleCharacter might need a robust stat modification system
            // that AttachedEffects can interact with (e.g., addModifier, removeModifier).
            // For now, we directly change currentAtk. This is a permanent change for the battle.
            // The BattleCharacter.modifyStat method will handle logging this to the battle log.
            this.owner.modifyStat('currentAtk', this.attackBonus);
            // console.log(`${this.owner.name}'s Heart of Light boosted ATK by ${this.attackBonus}. New ATK: ${this.owner.currentAtk}`); // Dev Log
            this.applied = true;

            // If this passive could also affect maxHp or other base-like stats,
            // you might need to call a recalculate/update method on the owner.
            // For now, ATK boost is straightforward.
        }
    }

    onExpire(context) {
        super.onExpire(context);
        // If the effect were temporary, revert the stat change here.
        // Since it's a permanent passive for the battle, no revert needed unless explicitly dispelled.
        // If it was dispellable, you'd do: this.owner.modifyStat('currentAtk', -this.attackBonus);
        // console.log(`Heart of Light effect removed from ${this.owner.name} (if it were dispellable).`); // Dev Log
        if (context && context.scene && context.scene.addBattleLogMessage && this.applied) { // Check if applied to avoid log on initial setup if not truly removed
            // context.scene.addBattleLogMessage(`${this.name} on ${this.owner.name} has worn off.`); // Generic, or more specific if needed
        }
    }
}


export class ElzetteDefinition extends CharacterDefinition {
    constructor() {
        super({
            id: "elzette",
            name: "Elzette",
            stats: { hp: 480, atk: 85, def: 35, critChance: 0.20, critDamage: 1.80 },
            faction: FACTION.LIGHT,
            playableByPlayer: true,
            description: "A radiant warrior of pure light.", // Forcing a visible change for cache busting
            faceIconKey: 'elzette_face_icon',
            faceIconPath: 'assets/elzette_illustration_face_icon.png',
            battleIconKey: 'elzette_battle_icon',
            battleIconPath: 'assets/elzette_illustration_4_3.png',
            landscapeIllustrationKey: 'elzetteLandscapeIllustration', // Renamed to camelCase and updated key
            landscapeIllustrationPath: 'assets/elzette_illustration_landscape.jpg' // Path remains the same
        });

        this.skillMetadata = {
            skillLightBlast: { id: "elzette_light_blast", name: "Light Blast", description: "Deals moderate Light damage to a single enemy.", type: 'active', cooldown: 4, targetType: 'enemy' },
            skillRadiantArea: { id: "elzette_radiant_area", name: "Radiant Area", description: "Deals low Light damage to all enemies.", type: 'active', cooldown: 4, targetType: 'allEnemies' },
            skillHeartOfLight: { id: "elzette_heart_of_light", name: "Heart of Light", description: "Passive: Increases ATK by 20.", type: 'passive', applyImmediately: true, modifiesStats: true },
        };
    }

    // --- Skill Methods ---
    // Note: The third argument `ownTeam` is still passed by BattleCharacter.determineAction,
    // and the fourth `casterContext` is new, providing {scene, owner}
    skillLightBlast(caster, targets, ownTeam, casterContext) {
        const subActions = [];
        if (!casterContext || !casterContext.scene) {
            console.error("ElzetteDefinition.skillLightBlast: BattleScene context not available in casterContext!");
            return subActions;
        }
        const battleScene = casterContext.scene; // For convenience

        const livingTargets = targets.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length === 0) {
            const noTargetsMsg = `${caster.getName()} used Light Blast, but no targets were available.`;
            // console.log(noTargetsMsg); // Dev Log
            if (battleScene && battleScene.addBattleLogMessage) battleScene.addBattleLogMessage(noTargetsMsg);
            return subActions;
        }

        const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
        const skillId = this.skillMetadata.skillLightBlast.id;

        const lightBlastAction = () => {
            if (target.isDefeatedStatus() || (battleScene && battleScene.isBattleOver)) {
                // console.log(`Light Blast: Target ${target.getName()} defeated or battle over.`); // Dev Log
                // No player log needed here, as the action doesn't proceed.
                return;
            }
            const damageOutput = Math.floor(caster.currentAtk * 2.0);
            // BattleScene logs "Caster prepares Skill Name".
            // SkillHelper.dealDamage -> target.takeDamage logs the actual damage.
            // console.log(`${caster.getName()} uses Light Blast on ${target.getName()}!`); // Dev Log
            if (battleScene && battleScene.addBattleLogMessage) {
                battleScene.addBattleLogMessage(`${caster.getName()} unleashes Light Blast on ${target.getName()}!`);
            }
            SkillHelper.dealDamage(caster, target, damageOutput, FACTION.LIGHT, { skillId: skillId }, battleScene);
        };

        subActions.push(lightBlastAction);
        return subActions;
    }

    skillRadiantArea(caster, targets, ownTeam, casterContext) {
        const subActions = [];
        if (!casterContext || !casterContext.scene) {
            console.error("ElzetteDefinition.skillRadiantArea: BattleScene context not available in casterContext!");
            return subActions;
        }
        const battleScene = casterContext.scene; // For convenience
        // `targets` for an 'allEnemies' skill will be the enemy team array.
        const skillId = this.skillMetadata.skillRadiantArea.id;

        const radiantAreaAction = () => {
            // Check if there are any living targets before proceeding
            const currentLivingTargets = targets.filter(t => t && !t.isDefeatedStatus());
            if (currentLivingTargets.length === 0 || (battleScene && battleScene.isBattleOver)) {
                const noTargetsMsg = `${caster.getName()} uses Radiant Area, but no targets remain or battle over.`;
                // console.log(noTargetsMsg); // Dev Log
                if (battleScene && battleScene.addBattleLogMessage) battleScene.addBattleLogMessage(noTargetsMsg);
                return;
            }
            
            const damageOutput = Math.floor(caster.currentAtk * 1.5);
            // BattleScene logs "Caster prepares Skill Name".
            // SkillHelper.dealDamageToAll -> dealDamage -> target.takeDamage logs individual damages.
            // console.log(`${caster.getName()} uses Radiant Area!`); // Dev Log
            if (battleScene && battleScene.addBattleLogMessage) {
                battleScene.addBattleLogMessage(`${caster.getName()} bathes the area in radiant light!`);
            }
            SkillHelper.dealDamageToAll(caster, currentLivingTargets, damageOutput, FACTION.LIGHT, { skillId: skillId }, battleScene);
        };
        
        subActions.push(radiantAreaAction);
        return subActions;
    }

    skillHeartOfLight(caster, targetTeam, ownTeam, casterContext) {
        // Passive skills are called by BattleCharacter.applyInitialPassiveEffects
        // They should now add an AttachedEffect to the caster.
        // The application of the effect and its stat modification will be logged by BattleCharacter.
        // console.log(`${caster.getName()}'s Heart of Light passive is being initialized.`); // Dev Log
        // if (casterContext && casterContext.scene && casterContext.scene.addBattleLogMessage) {
        //     casterContext.scene.addBattleLogMessage(`${caster.getName()}'s Heart of Light activates!`);
        // }

        const attackBonus = Math.floor(this.stats.atk * 0.2); // Ensure integer for stat modification

        const effect = new HeartOfLightEffect({
            owner: caster,
            sourceSkillId: this.skillMetadata.skillHeartOfLight.id,
            attackBonus: attackBonus
        });
        caster.addAttachedEffect(effect);
        // The onApply method of HeartOfLightEffect will handle the actual stat modification.
    }
}