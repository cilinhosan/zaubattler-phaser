// src/character_definitions/CursedBoarDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';
import AttachedEffect from '../game/AttachedEffect.js';
import { BleedEffect } from '../base_effects/BleedEffect.js'; // Import shared BleedEffect

// --- Define Protective Herd effect (Ally Defense Bonus) ---
class ProtectiveHerdEffect extends AttachedEffect {
    constructor({ owner, sourceSkillId }) {
        super({
            owner,
            type: 'passive_ally_def_bonus', // Unique type
            duration: Infinity,
            sourceSkillId,
            name: "Protective Herd",
            description: "Increases Defense based on the number of living allies.",
            isBuff: true,
            isHidden: false, // Or true if the stat change is just reflected directly
        });
        this.defBonusPerAlly = 0.25; // 25% defense per ally
        this.lastAppliedDefBonus = 0;
    }

    onApply(context) {
        super.onApply(context);
        this.updateBuff(context);
        // TODO: In a full game, subscribe to ally death/revival events here to call this.updateBuff(context)
    }

    updateBuff(context) {
        if (!this.owner || !context || !context.ownTeam) {
            if (this.lastAppliedDefBonus !== 0) {
                this.owner.currentDef = Math.max(0, this.owner.currentDef - this.lastAppliedDefBonus);
                this.lastAppliedDefBonus = 0;
            }
            this.description = "Increases DEF based on living allies (currently unable to calculate).";
            if (this.owner.refreshEffectDisplay) this.owner.refreshEffectDisplay(this);
            return;
        }

        // Revert previous raw bonus before applying new one
        this.owner.currentDef = Math.max(0, this.owner.currentDef - this.lastAppliedDefBonus);

        // Count living allies (excluding self)
        const aliveAlliesCount = context.ownTeam.filter(
            ally => ally && ally !== this.owner && !ally.isDefeatedStatus()
        ).length;

        const baseDef = this.owner.baseDef || (this.owner.stats ? this.owner.stats.def : 0);
        const newDefBonus = Math.floor(baseDef * this.defBonusPerAlly * aliveAlliesCount);

        this.owner.currentDef += newDefBonus;
        this.lastAppliedDefBonus = newDefBonus;

        const percentageBonus = aliveAlliesCount * (this.defBonusPerAlly * 100);
        this.description = `Increases DEF by ${percentageBonus}% (${aliveAlliesCount} allies). Currently: +${newDefBonus} DEF.`;
        
        if (this.owner.refreshEffectDisplay) {
            this.owner.refreshEffectDisplay(this);
        }
    }

    onExpire(context) {
        super.onExpire(context);
        this.owner.currentDef = Math.max(0, this.owner.currentDef - this.lastAppliedDefBonus);
        this.lastAppliedDefBonus = 0;
        // TODO: In a full game, unsubscribe from events here
    }
}
// End of ProtectiveHerdEffect class

export class CursedBoarDefinition extends CharacterDefinition { // Renamed class
     constructor() {
        super({
            id: "cursedBoar", // Changed ID
            name: "Cursed Boar", // Changed name
            stats: { hp: 850, atk: 80, def: 50, critChance: 0.10, critDamage: 1.50 }, // Stats remain same as Cursed Wolf for now
            faction: FACTION.NEUTRAL,
            playableByPlayer: false,
            description: "A ferocious, cursed boar.", // Updated description
            faceIconKey: 'default_character_icon', // Consider updating if new assets are made
            faceIconPath: 'assets/default_character_ilustration_face_icon.png',
            battleIconKey: 'default_enemy_icon', // Consider updating if new assets are made
            battleIconPath: 'assets/default_enemy_illustration_4_3.png'
        });

        // Update skill IDs and names for Cursed Boar
        this.skillMetadata = {
            skillBloodthirstyTusks: { id: "cursed_boar_bloodthirsty_tusks", name: "Bloodthirsty Tusks", description: "Attacks a random target (130% ATK). If target isn't Bleeding, applies Bleed. If target is Bleeding, attacks again.", type: 'active', cooldown: 4, targetType: 'enemy' },
            skillBloodFrenzy: { id: "cursed_boar_blood_frenzy", name: "Blood Frenzy", description: "Passive: Deals double damage to enemies suffering from Bleed.", type: 'passive', applyImmediately: false }, // This passive's logic is implemented in skillCharge
            skillProtectiveHerd: { id: "cursed_boar_protective_herd", name: "Protective Herd", description: "Passive: Defense increases by 25% for each other living ally.", type: 'passive', applyImmediately: true, modifiesStats: true }
        };
    }

    skillBloodthirstyTusks(caster, targets, ownTeam, casterContext) {
        // This skill method now returns an array of "sub-action" functions.
        // Each function in the array will be executed sequentially by BattleScene, with delays in between.
        const subActions = [];
        const battleScene = casterContext.scene; // Keep for logging or complex conditions if needed inside sub-actions

        if (!casterContext || !casterContext.scene) { // Ensure scene context is available for sub-actions
            console.error("CursedBoarDefinition.skillBloodthirstyTusks: BattleScene context not available in casterContext!");
            return subActions; // Return empty array if no context
        }

        const livingTargets = targets.filter(t => t && t.isDefeatedStatus() === false);
        if (livingTargets.length === 0) {
            console.log(`${caster.getName()} used Bloodthirsty Tusks, but no targets were available.`);
            // Add a "pass" or "log only" sub-action if desired, or just return empty.
            // For now, returning empty means the skill effectively does nothing if no targets.
            return subActions;
        }

        const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
        const skillId = this.skillMetadata.skillBloodthirstyTusks.id;
        
        // This console log will now likely appear before the first sub-action's delay in BattleScene
        console.log(`${caster.getName()} initiates Bloodthirsty Tusks on ${target.getName()}!`);

        // Define the actual attack logic within a function that can be pushed to subActions
        const createAttackSubAction = (currentTarget, attackNumber) => {
            return () => { // This is the sub-action function
                // It's crucial that casterContext.scene is valid here when the sub-action executes
                if (!casterContext.scene) {
                    console.error("Bloodthirsty Tusks sub-action: casterContext.scene is undefined!");
                    return;
                }
                if (currentTarget.isDefeatedStatus() || casterContext.scene.isBattleOver) {
                    console.log(`Bloodthirsty Tusks (Sub-action #${attackNumber}): Target ${currentTarget.getName()} defeated or battle over.`);
                    return; // Skip if target defeated or battle ended
                }
                
                let damage = Math.floor(caster.currentAtk * 1.3); // 130% ATK
                const isTargetBleedingForThisHit = currentTarget.attachedEffects.some(effect => effect.type === 'bleed' && effect.isActive);
                
                if (isTargetBleedingForThisHit) {
                    console.log(`${caster.getName()}'s Blood Frenzy activates for Bloodthirsty Tusks (Attack #${attackNumber}) against bleeding ${currentTarget.getName()}!`);
                    damage *= 2;
                }
                console.log(`Bloodthirsty Tusks (Attack #${attackNumber}) dealing ${damage} to ${currentTarget.getName()}`);
                SkillHelper.dealDamage(caster, currentTarget, damage, FACTION.NEUTRAL, { skillId: skillId }, casterContext.scene);
            };
        };

        const createApplyBleedSubAction = (currentTarget) => {
            return () => {
                if (!casterContext.scene) {
                    console.error("Bloodthirsty Tusks apply bleed sub-action: casterContext.scene is undefined!");
                    return;
                }
                if (currentTarget.isDefeatedStatus() || casterContext.scene.isBattleOver) {
                    console.log(`Bloodthirsty Tusks: Target ${currentTarget.getName()} defeated or battle over before Bleed application.`);
                    return;
                }
                console.log(`Bloodthirsty Tusks applies Bleed to ${currentTarget.getName()}!`);
                const bleedEffect = new BleedEffect({
                    owner: currentTarget,
                    sourceSkillId: skillId,
                });
                currentTarget.addAttachedEffect(bleedEffect, casterContext); // casterContext includes scene
            };
        };
        
        const isTargetInitiallyBleeding = target.attachedEffects.some(effect => effect.type === 'bleed' && effect.isActive);

        if (isTargetInitiallyBleeding) {
            console.log(`${target.getName()} is already bleeding. Bloodthirsty Tusks will strike twice.`);
            subActions.push(createAttackSubAction(target, 1)); // Add first attack sub-action
            subActions.push(createAttackSubAction(target, 2)); // Add second attack sub-action
        } else {
            console.log(`${target.getName()} is not initially bleeding. Bloodthirsty Tusks will attack and apply Bleed.`);
            subActions.push(createAttackSubAction(target, 1));    // Add the single attack sub-action
            subActions.push(createApplyBleedSubAction(target)); // Add apply bleed sub-action
        }
        
        return subActions;
    } // End of skillBloodthirstyTusks

    // Renamed from skillToughHide to skillBloodFrenzy.
    // This passive doesn't apply an effect directly; its logic is checked in skillCharge.
    skillBloodFrenzy(caster, targetTeam, ownTeam, casterContext) {
        // console.log(`${caster.getName()}'s Blood Frenzy passive is part of their definition.`);
        // No direct effect needs to be applied here for this type of passive.
        // The existence of this skill in skillMetadata is enough for skillCharge to check.
    }

    skillProtectiveHerd(caster, targetTeam, ownTeam, casterContext) {
        // console.log(`${caster.getName()}'s Protective Herd passive is being initialized.`);
        const effect = new ProtectiveHerdEffect({
            owner: caster,
            sourceSkillId: this.skillMetadata.skillProtectiveHerd.id,
        });
        // Pass casterContext so the effect's onApply method can use it (e.g., for ownTeam)
        // ownTeam is available in casterContext.ownTeam if BattleCharacter.getEffectContext() is set up correctly
        caster.addAttachedEffect(effect, casterContext);
    }
}