// src/character_definitions/KatherineDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';
import AttachedEffect from '../game/AttachedEffect.js'; // Import base class

// --- Define a specific effect for Heart of Fire ---
class HeartOfFireEffect extends AttachedEffect {
    constructor({ owner, sourceSkillId, attackBonus }) {
        super({
            owner,
            type: 'passive_atk_boost_katherine', // Unique type for Katherine's passive
            duration: Infinity,
            sourceSkillId,
            name: 'Heart of Fire',
            description: `Increases ATK by ${attackBonus}.`,
            isBuff: true,
            isHidden: false,
        });
        this.attackBonus = attackBonus;
        this.applied = false;
    }

    onApply(context) {
        super.onApply(context);
        if (!this.applied) {
            this.owner.currentAtk += this.attackBonus;
            console.log(`${this.owner.name}'s Heart of Fire boosted ATK by ${this.attackBonus}. New ATK: ${this.owner.currentAtk}`);
            this.applied = true;
        }
    }

    onExpire(context) {
        super.onExpire(context);
        // Only revert if it was meant to be dispellable/temporary
        // For a permanent battle passive, this might not be needed unless dispelled.
        // if (this.applied) { this.owner.currentAtk -= this.attackBonus; }
        console.log(`Heart of Fire effect removed from ${this.owner.name} (if it were dispellable).`);
    }
}


export class KatherineDefinition extends CharacterDefinition {
    constructor() {
        super({
            id: "katherine",
            name: "Katherine",
            stats: { hp: 480, atk: 85, def: 35, critChance: 0.20, critDamage: 1.80 },
            faction: FACTION.CRIMSON,
            playableByPlayer: true,
            description: "A fiery warrior.",
            faceIconKey: 'default_character_icon', // Reverted to original
            faceIconPath: 'assets/default_character_ilustration_face_icon.png', // Reverted to original
            battleIconKey: 'default_battle_icon', // Reverted to original
            battleIconPath: 'assets/default_character_ilustration_4_3.png', // Reverted to original
            // landscapeIllustrationKey: 'katherine_landscape', // Using default from BaseDefinitions
            // landscapeIllustrationPath: 'assets/default_character_illustration_landscape.jpg', // Using default
            profileIllustrationKey: 'katherine_profile_illustration',
            profileIllustrationPath: 'assets/default_character_ilustration_4_3.png'
        });

        this.skillMetadata = {
            skillFireBlast: { id: "katherine_fire_blast", name: "Fire Blast", description: "Deals moderate Fire damage to a single enemy.", type: 'active', cooldown: 4, targetType: 'enemy' },
            skillVolcanicArea: { id: "katherine_volcanic_area", name: "Volcanic Area", description: "Deals low Fire damage to all enemies.", type: 'active', cooldown: 4, targetType: 'allEnemies' },
            skillHeartOfFire: { id: "katherine_heart_of_fire", name: "Heart of Fire", description: "Passive: Increases ATK by 15.", type: 'passive', applyImmediately: true, modifiesStats: true },
        };
    }

    // --- Skill Methods ---
    // casterContext provides {scene, owner}
    skillFireBlast(caster, targets, ownTeam, casterContext) {
        const subActions = [];
        if (!casterContext || !casterContext.scene) {
            console.error("KatherineDefinition.skillFireBlast: BattleScene context not available in casterContext!");
            return subActions;
        }
        const battleScene = casterContext.scene; // For convenience

        const livingTargets = targets.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length === 0) {
            console.log(`${caster.getName()} used Fire Blast, but no targets were available.`);
            return subActions;
        }

        const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
        const skillId = this.skillMetadata.skillFireBlast.id;

        const fireBlastAction = () => {
            if (target.isDefeatedStatus() || (battleScene && battleScene.isBattleOver)) {
                console.log(`Fire Blast: Target ${target.getName()} defeated or battle over.`);
                return;
            }
            const damageOutput = Math.floor(caster.currentAtk * 3.0);
            console.log(`${caster.getName()} uses Fire Blast on ${target.getName()}!`);
            SkillHelper.dealDamage(caster, target, damageOutput, FACTION.CRIMSON, { skillId: skillId }, battleScene);
        };

        subActions.push(fireBlastAction);
        return subActions;
    }

    skillVolcanicArea(caster, targets, ownTeam, casterContext) {
        const subActions = [];
        if (!casterContext || !casterContext.scene) {
            console.error("KatherineDefinition.skillVolcanicArea: BattleScene context not available in casterContext!");
            return subActions;
        }
        const battleScene = casterContext.scene; // For convenience
        
        const skillId = this.skillMetadata.skillVolcanicArea.id;

        const volcanicAreaAction = () => {
            const currentLivingTargets = targets.filter(t => t && !t.isDefeatedStatus());
            if (currentLivingTargets.length === 0 || (battleScene && battleScene.isBattleOver)) {
                console.log(`${caster.getName()} uses Volcanic Area, but no targets remain or battle over.`);
                return;
            }

            const damageOutput = Math.floor(caster.currentAtk * 1.2);
            console.log(`${caster.getName()} uses Volcanic Area!`);
            SkillHelper.dealDamageToAll(caster, currentLivingTargets, damageOutput, FACTION.CRIMSON, { skillId: skillId }, battleScene);
        };

        subActions.push(volcanicAreaAction);
        return subActions;
    }

    skillHeartOfFire(caster, targetTeam, ownTeam, casterContext) {
        console.log(`${caster.getName()}'s Heart of Fire passive is being initialized.`);
        const attackBonus = this.stats.atk * 0.3; // Example bonus

        const effect = new HeartOfFireEffect({
            owner: caster,
            sourceSkillId: this.skillMetadata.skillHeartOfFire.id,
            attackBonus: attackBonus
        });
        caster.addAttachedEffect(effect);
    }
}