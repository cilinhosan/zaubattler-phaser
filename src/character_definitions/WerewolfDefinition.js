// src/character_definitions/WerewolfDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';
import AttachedEffect from '../game/AttachedEffect.js';
import DamageOverTimeEffect from '../base_effects/DamageOverTimeEffect.js';

// --- Define a specific effect for Lunar Frenzy (ATK Boost at low HP) ---
class LunarFrenzyEffect extends AttachedEffect {
    constructor({ owner, sourceSkillId, attackBonus, hpThreshold }) {
        super({
            owner,
            type: 'passive_atk_boost_low_hp_werewolf',
            duration: Infinity,
            sourceSkillId,
            name: 'Lunar Frenzy',
            description: `Increases ATK by ${attackBonus} when HP is below ${hpThreshold * 100}%.`,
            isBuff: true,
            isHidden: false,
        });
        this.attackBonus = attackBonus;
        this.hpThreshold = hpThreshold;
        this.bonusApplied = false;
    }

    _checkAndApplyBonus() {
        if (!this.owner || this.owner.isDefeatedStatus()) {
            if (this.bonusApplied) { // Ensure bonus is removed if owner is defeated
                this.owner.currentAtk -= this.attackBonus;
                this.bonusApplied = false;
                console.log(`${this.owner.name}'s Lunar Frenzy deactivates due to defeat. ATK returned to normal.`);
            }
            return;
        }

        const currentHpRatio = this.owner.getCurrentHp() / this.owner.getMaxHp();
        if (currentHpRatio <= this.hpThreshold) {
            if (!this.bonusApplied) {
                this.owner.currentAtk += this.attackBonus;
                this.bonusApplied = true;
                console.log(`${this.owner.name}'s Lunar Frenzy activates! ATK increased by ${this.attackBonus}. New ATK: ${this.owner.currentAtk}`);
            }
        } else {
            if (this.bonusApplied) {
                this.owner.currentAtk -= this.attackBonus;
                this.bonusApplied = false;
                console.log(`${this.owner.name}'s Lunar Frenzy deactivates. ATK returned to normal. New ATK: ${this.owner.currentAtk}`);
            }
        }
    }

    onApply(context) {
        super.onApply(context);
        this._checkAndApplyBonus();
    }

    onGlobalTurnStart(context, currentGlobalTurn) {
        super.onGlobalTurnStart(context, currentGlobalTurn);
        this._checkAndApplyBonus();
    }

    onActionPhaseStart(context, currentGlobalTurn) {
        super.onActionPhaseStart(context, currentGlobalTurn);
        this._checkAndApplyBonus();
    }

    onDamageTaken(context, damageInfo) {
        this._checkAndApplyBonus();
        return damageInfo;
    }

    onExpire(context) {
        super.onExpire(context);
        if (this.bonusApplied) {
            if (this.owner && !this.owner.isDefeatedStatus()) {
                 this.owner.currentAtk -= this.attackBonus;
            }
            this.bonusApplied = false;
            console.log(`${this.owner.name}'s Lunar Frenzy expired. ATK bonus removed.`);
        }
    }
}


export class WerewolfDefinition extends CharacterDefinition {
     constructor() {
        super({
            id: "werewolf",
            name: "Werewolf",
            stats: { hp: 550, atk: 110, def: 40, critChance: 0.15, critDamage: 1.70 }, // ATK increased to 110
            faction: FACTION.DARK,
            playableByPlayer: false,
            description: "A fearsome werewolf.",
            faceIconKey: 'default_character_icon',
            faceIconPath: 'assets/default_character_ilustration_face_icon.png',
            battleIconKey: 'default_enemy_icon',
            battleIconPath: 'assets/default_enemy_illustration_4_3.png',
            // landscapeIllustrationKey: 'werewolf_landscape', // Using default from BaseDefinitions
            // landscapeIllustrationPath: 'assets/default_character_illustration_landscape.jpg', // Using default
            profileIllustrationKey: 'werewolf_profile_illustration',
            profileIllustrationPath: 'assets/default_enemy_illustration_4_3.png'
        });

        this.skillMetadata = {
            skillSavageClaw: { id: "werewolf_savage_claw", name: "Savage Claw", description: "Deals physical damage with a chance to cause Bleed.", type: 'active', cooldown: 4, targetType: 'enemy' },
            skillLunarFrenzy: { id: "werewolf_lunar_frenzy", name: "Lunar Frenzy", description: "Passive: Increases ATK by 25 when HP is below 40%.", type: 'passive', applyImmediately: true, modifiesStats: true }
        };
    }

    skillSavageClaw(caster, targets, ownTeam, casterContext) {
        const battleScene = casterContext.scene;
        if (!battleScene) {
            console.error("WerewolfDefinition.skillSavageClaw: BattleScene context not available!");
            return;
        }

        const livingTargets = targets.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            const damage = caster.currentAtk * 1.1; // 110 * 1.1 = 121
            console.log(`${caster.getName()} uses Savage Claw on ${target.getName()}!`);
            SkillHelper.dealDamage(caster, target, Math.floor(damage), FACTION.DARK, { skillId: this.skillMetadata.skillSavageClaw.id }, battleScene);

            const bleedChance = 0.5;
            if (Math.random() < bleedChance) {
                console.log(`${target.getName()} starts bleeding!`);
                const bleedEffect = new DamageOverTimeEffect({
                    owner: target,
                    sourceSkillId: this.skillMetadata.skillSavageClaw.id,
                    name: "Bleed (Savage Claw)",
                    totalDamage: caster.currentAtk * 0.6, // 110 * 0.6 = 66 total
                    turns: 3,
                    damageType: 'bleed'
                });
                SkillHelper.applyAttachedEffect(caster, target, bleedEffect, battleScene);
            }
        } else {
            console.log(`${caster.getName()} used Savage Claw, but no targets were available.`);
        }
    }

    skillLunarFrenzy(caster, targetTeam, ownTeam, casterContext) {
        console.log(`${caster.getName()}'s Lunar Frenzy passive is being initialized.`);
        const attackBonus = 25;
        const hpThreshold = 0.40;

        const effect = new LunarFrenzyEffect({
            owner: caster,
            sourceSkillId: this.skillMetadata.skillLunarFrenzy.id,
            attackBonus: attackBonus,
            hpThreshold: hpThreshold
        });
        caster.addAttachedEffect(effect);
    }
}