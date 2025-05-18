// src/character_definitions/CursedWolfDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';
import AttachedEffect from '../game/AttachedEffect.js';
import { BleedEffect } from '../base_effects/BleedEffect.js'; // Import shared BleedEffect

// --- Define the new Pack Hunter effect (Ally Stat Bonus) ---
class PackHunterAllyBonusEffect extends AttachedEffect {
    constructor({ owner, sourceSkillId }) {
        super({
            owner,
            type: 'passive_ally_stat_bonus',
            duration: Infinity,
            sourceSkillId,
            name: "Pack Hunter",
            description: "Increases Attack and Defense based on the number of living allies.",
            isBuff: true,
            isHidden: false,
        });
        this.atkBonusPerAlly = 0.10;
        this.defBonusPerAlly = 0.10;
        this.lastAppliedAtkBonus = 0;
        this.lastAppliedDefBonus = 0;
    }

    onApply(context) {
        super.onApply(context);
        this.updateBuff(context);
        // In a full game, subscribe to ally death/revival events here to call this.updateBuff(context)
        // e.g., if (context && context.battleScene && context.battleScene.eventManager) {
        //    context.battleScene.eventManager.on('teamMemberStateChanged', () => this.updateBuff(context), this);
        // }
    }

    updateBuff(context) {
        if (!this.owner || !context || !context.ownTeam) {
            // Revert any existing bonus if context is lost, to prevent lingering incorrect buffs
            if (this.lastAppliedAtkBonus !== 0 || this.lastAppliedDefBonus !== 0) {
                this.owner.currentAtk = Math.max(0, this.owner.currentAtk - this.lastAppliedAtkBonus);
                this.owner.currentDef = Math.max(0, this.owner.currentDef - this.lastAppliedDefBonus);
                this.lastAppliedAtkBonus = 0;
                this.lastAppliedDefBonus = 0;
            }
            this.description = "Increases ATK & DEF based on living allies (currently unable to calculate).";
            if (this.owner.refreshEffectDisplay) this.owner.refreshEffectDisplay(this);
            return;
        }

        // Revert previous raw bonus before applying new one
        this.owner.currentAtk = Math.max(0, this.owner.currentAtk - this.lastAppliedAtkBonus);
        this.owner.currentDef = Math.max(0, this.owner.currentDef - this.lastAppliedDefBonus);

        // Count living allies (excluding self)
        const aliveAlliesCount = context.ownTeam.filter(
            ally => ally && ally !== this.owner && !ally.isDefeatedStatus()
        ).length;

        // Determine base stats for calculation
        const baseAtk = this.owner.baseAtk || (this.owner.stats ? this.owner.stats.atk : 0);
        const baseDef = this.owner.baseDef || (this.owner.stats ? this.owner.stats.def : 0);

        const newAtkBonus = Math.floor(baseAtk * this.atkBonusPerAlly * aliveAlliesCount);
        const newDefBonus = Math.floor(baseDef * this.defBonusPerAlly * aliveAlliesCount);

        this.owner.currentAtk += newAtkBonus;
        this.owner.currentDef += newDefBonus;

        this.lastAppliedAtkBonus = newAtkBonus;
        this.lastAppliedDefBonus = newDefBonus;

        const percentageBonus = aliveAlliesCount * 10;
        this.description = `Increases ATK & DEF by ${percentageBonus}% (${aliveAlliesCount} allies). Currently: +${newAtkBonus} ATK, +${newDefBonus} DEF.`;
        
        // For debugging:
        // console.log(`${this.owner.name}'s ${this.name} updated: ${aliveAlliesCount} allies. ATK +${newAtkBonus} (+${percentageBonus}%), DEF +${newDefBonus} (+${percentageBonus}%). New stats: ATK ${this.owner.currentAtk}, DEF ${this.owner.currentDef}`);

        if (this.owner.refreshEffectDisplay) {
            this.owner.refreshEffectDisplay(this);
        }
    }

    onExpire(context) {
        super.onExpire(context);
        this.owner.currentAtk = Math.max(0, this.owner.currentAtk - this.lastAppliedAtkBonus);
        this.owner.currentDef = Math.max(0, this.owner.currentDef - this.lastAppliedDefBonus);
        this.lastAppliedAtkBonus = 0;
        this.lastAppliedDefBonus = 0;
        // console.log(`${this.name} effect expired/removed from ${this.owner.name}. Stats reverted.`);
        // In a full game, unsubscribe from events here
    }
}

// Local BleedEffect class definition removed, now imported from base_effects.


export class CursedWolfDefinition extends CharacterDefinition { // Renamed class
     constructor() {
        super({
            id: "cursedWolf", // Changed ID
            name: "Cursed Wolf", // Changed name
            stats: { hp: 850, atk: 80, def: 50, critChance: 0.10, critDamage: 1.50 }, // ATK increased to 80
            faction: FACTION.NEUTRAL,
            playableByPlayer: false,
            description: "A wild, cursed wolf.", // Updated description
            faceIconKey: 'default_character_icon', // Consider updating if new assets are made
            faceIconPath: 'assets/default_character_ilustration_face_icon.png',
            battleIconKey: 'default_enemy_icon', // Consider updating if new assets are made
            battleIconPath: 'assets/default_enemy_illustration_4_3.png',
            // landscapeIllustrationKey: 'cursed_wolf_landscape', // Using default from BaseDefinitions
            // landscapeIllustrationPath: 'assets/default_character_illustration_landscape.jpg', // Using default
            profileIllustrationKey: 'cursed_wolf_profile_illustration',
            profileIllustrationPath: 'assets/default_enemy_illustration_4_3.png'
        });

        // Update skill IDs to reflect new character ID for clarity, though not strictly necessary if skills are generic
        this.skillMetadata = {
            skillBite: { id: "cursed_wolf_bite", name: "Bite", description: "Deals physical damage. 50% chance to apply Bleed (5% Max HP/turn for 2 turns).", type: 'active', cooldown: 3, targetType: 'enemy' },
            skillPackHunter: { id: "cursed_wolf_pack_hunter", name: "Pack Hunter", description: "Passive: For each living ally, increases Attack and Defense by 10%.", type: 'passive', applyImmediately: true, modifiesStats: true }
        };
    }

    skillBite(caster, targets, ownTeam, casterContext) {
        const subActions = [];
        if (!casterContext || !casterContext.scene) {
            console.error("CursedWolfDefinition.skillBite: BattleScene context not available in casterContext!");
            return subActions;
        }
        const battleScene = casterContext.scene; // For convenience

        const livingTargets = targets.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length === 0) {
            console.log(`${caster.getName()} used Bite, but no targets were available.`);
            return subActions;
        }

        const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
        const skillId = this.skillMetadata.skillBite.id;

        // Define the sub-action function
        const biteAction = () => {
            if (target.isDefeatedStatus() || (battleScene && battleScene.isBattleOver)) {
                console.log(`Bite: Target ${target.getName()} defeated or battle over before action.`);
                return;
            }

            console.log(`${caster.getName()} bites ${target.getName()}!`);
            const damage = Math.floor(caster.currentAtk * 1.8);
            SkillHelper.dealDamage(caster, target, damage, FACTION.NEUTRAL, { skillId: skillId }, battleScene);

            // 50% chance to apply Bleed, only if target is still alive after damage
            if (!target.isDefeatedStatus() && Math.random() < 0.50) {
                console.log(`Bite attempts to apply Bleed to ${target.getName()}.`);
                const bleedEffect = new BleedEffect({
                    owner: target,
                    sourceSkillId: skillId,
                });
                target.addAttachedEffect(bleedEffect, casterContext);
            }
        };

        subActions.push(biteAction);
        return subActions;
    }

    skillPackHunter(caster, targetTeam, ownTeam, casterContext) {
        // The casterContext (which includes ownTeam) is passed to the effect's onApply method
        // console.log(`${caster.getName()}'s Pack Hunter (Ally Bonus) passive is being initialized.`);
        const effect = new PackHunterAllyBonusEffect({
            owner: caster,
            sourceSkillId: this.skillMetadata.skillPackHunter.id,
        });
        // Pass casterContext so the effect's onApply method can use it (e.g., for ownTeam)
        caster.addAttachedEffect(effect, casterContext);
    }
}