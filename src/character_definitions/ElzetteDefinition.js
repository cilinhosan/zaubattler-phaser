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
            this.owner.currentAtk += this.attackBonus;
            console.log(`${this.owner.name}'s Heart of Light boosted ATK by ${this.attackBonus}. New ATK: ${this.owner.currentAtk}`);
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
        // If it was dispellable, you'd do: this.owner.currentAtk -= this.attackBonus;
        console.log(`Heart of Light effect removed from ${this.owner.name} (if it were dispellable).`);
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
            description: "A radiant warrior.",
            faceIconKey: 'elzette_face_icon',
            faceIconPath: 'assets/elzette_illustration_face_icon.png',
            battleIconKey: 'elzette_battle_icon',
            battleIconPath: 'assets/elzette_illustration_4_3.png'
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
        // Active skills now receive the casterContext which contains the scene
        const battleScene = casterContext.scene;
        if (!battleScene) {
            console.error("ElzetteDefinition.skillLightBlast: BattleScene context not available!");
            return;
        }

        const livingTargets = targets.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            // Skills should now select their own specific target(s) from the provided list
            // For a single target skill, we might pick the first, or a random one.
            // BattleScene's execute will pass the `currentTargetTeam` or `currentCasterTeam`
            // based on `targetType` from metadata, but skills can refine this.
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)]; // Example: random target
            const damageOutput = Math.floor(caster.currentAtk * 2.0);
            
            console.log(`${caster.getName()} uses Light Blast on ${target.getName()}!`);
            SkillHelper.dealDamage(caster, target, damageOutput, FACTION.LIGHT, { skillId: this.skillMetadata.skillLightBlast.id }, battleScene);
        } else {
            console.log(`${caster.getName()} used Light Blast, but no targets were available.`);
        }
    }

    skillRadiantArea(caster, targets, ownTeam, casterContext) {
        const battleScene = casterContext.scene;
        if (!battleScene) {
            console.error("ElzetteDefinition.skillRadiantArea: BattleScene context not available!");
            return;
        }
        const damageOutput = Math.floor(caster.currentAtk * 1.5);
        
        // `targets` for an 'allEnemies' skill will be the enemy team.
        // `SkillHelper.dealDamageToAll` will iterate through them.
        console.log(`${caster.getName()} uses Radiant Area!`);
        SkillHelper.dealDamageToAll(caster, targets, Math.floor(damageOutput), FACTION.LIGHT, { skillId: this.skillMetadata.skillRadiantArea.id }, battleScene);
    }

    skillHeartOfLight(caster, targetTeam, ownTeam, casterContext) {
        // Passive skills are called by BattleCharacter.applyInitialPassiveEffects
        // They should now add an AttachedEffect to the caster.
        console.log(`${caster.getName()}'s Heart of Light passive is being initialized.`);

        const attackBonus = this.stats.atk * 0.2; // Define the bonus here or get from metadata

        const effect = new HeartOfLightEffect({
            owner: caster,
            sourceSkillId: this.skillMetadata.skillHeartOfLight.id,
            attackBonus: attackBonus
        });
        caster.addAttachedEffect(effect);
        // The onApply method of HeartOfLightEffect will handle the actual stat modification.
    }
}