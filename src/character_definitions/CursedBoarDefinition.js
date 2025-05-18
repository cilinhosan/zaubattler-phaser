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
            battleIconPath: 'assets/default_enemy_illustration_4_3.png',
            // landscapeIllustrationKey: 'cursed_boar_landscape', // Using default from BaseDefinitions
            // landscapeIllustrationPath: 'assets/default_character_illustration_landscape.jpg', // Using default
            profileIllustrationKey: 'cursed_boar_profile_illustration',
            profileIllustrationPath: 'assets/default_enemy_illustration_4_3.png'
        });

        // Update skill IDs and names for Cursed Boar
        this.skillMetadata = {
            skillBloodthirstyTusks: {
                id: "cursed_boar_bloodthirsty_tusks",
                name: "Bloodthirsty Tusks",
                description: "Gores a random enemy for 130% Attack as Dark damage. Damage is doubled by Blood Frenzy if the target is Bleeding. If the target was Bleeding before this attack, strikes again (with Blood Frenzy). If not Bleeding, inflicts Bleed after the first hit.",
                type: 'active',
                cooldown: 4,
                targetType: 'enemy'
            },
            skillBloodFrenzy: {
                id: "cursed_boar_blood_frenzy",
                name: "Blood Frenzy",
                description: "Passive: The Cursed Boar deals double damage with its attacks against targets currently suffering from Bleed.",
                type: 'passive',
                applyImmediately: false
            }, // This passive's logic is implemented in skillCharge
            skillProtectiveHerd: {
                id: "cursed_boar_protective_herd",
                name: "Protective Herd",
                description: "Passive: The Cursed Boar's Defense is increased by 25% of its base Defense for each other living ally on the field.",
                type: 'passive',
                applyImmediately: true,
                modifiesStats: true
            },
            skillSavageRush: {
                id: "cursed_boar_savage_rush",
                name: "Savage Rush",
                description: "Charges a random living enemy for 200% Attack as Dark damage. If the target is Bleeding, the Boar attacks another random living enemy not yet hit by this skill. This chain continues as long as bleeding targets are hit. If a non-Bleeding target is hit, Bleed is applied to it, and the rush ends. The rush also ends if all living enemies have been hit once.",
                type: 'active',
                cooldown: 4,
                targetType: 'enemy'
            }
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
skillSavageRush(caster, targets, ownTeam, casterContext) {
        const subActions = [];
        const skillId = this.skillMetadata.skillSavageRush.id;

        if (!casterContext || !casterContext.scene) {
            console.error("CursedBoarDefinition.skillSavageRush: BattleScene context not available!");
            return subActions;
        }

        // Helper to create attack sub-action
        const createAttackSubAction_SavageRush = (currentTarget, attackChainNumber) => {
            return () => {
                if (!casterContext.scene) {
                    console.error(`Savage Rush Attack #${attackChainNumber} sub-action: casterContext.scene is undefined!`);
                    return;
                }
                if (currentTarget.isDefeatedStatus() || casterContext.scene.isBattleOver) {
                    console.log(`Savage Rush Attack #${attackChainNumber}: Target ${currentTarget.getName()} defeated or battle over.`);
                    return;
                }
                let damage = Math.floor(caster.currentAtk * 2); // 130% ATK
                console.log(`${caster.getName()}'s Savage Rush (Attack #${attackChainNumber}) dealing ${damage} to ${currentTarget.getName()}`);
                SkillHelper.dealDamage(caster, currentTarget, damage, FACTION.NEUTRAL, { skillId }, casterContext.scene);
            };
        };

        // Helper to create apply bleed sub-action
        const createApplyBleedSubAction_SavageRush = (currentTarget) => {
            return () => {
                if (!casterContext.scene) {
                    console.error("Savage Rush Apply Bleed sub-action: casterContext.scene is undefined!");
                    return;
                }
                if (currentTarget.isDefeatedStatus() || casterContext.scene.isBattleOver) {
                    console.log(`Savage Rush Apply Bleed: Target ${currentTarget.getName()} defeated or battle over.`);
                    return;
                }
                // Check again if target is bleeding *just before applying*, in case another effect applied it.
                const isTargetCurrentlyBleeding = currentTarget.attachedEffects.some(effect => effect.type === 'bleed' && effect.isActive);
                if (!isTargetCurrentlyBleeding) {
                    console.log(`Savage Rush applies Bleed to ${currentTarget.getName()}!`);
                    const bleedEffect = new BleedEffect({ owner: currentTarget, sourceSkillId: skillId });
                    currentTarget.addAttachedEffect(bleedEffect, casterContext);
                } else {
                    console.log(`${currentTarget.getName()} is already Bleeding. Savage Rush will not re-apply Bleed.`);
                }
            };
        };

        let initialLivingTargets = targets.filter(t => t && !t.isDefeatedStatus());
        if (initialLivingTargets.length === 0) {
            console.log(`${caster.getName()} used Savage Rush, but no targets were available.`);
            return subActions;
        }

        console.log(`${caster.getName()} initiates Savage Rush!`);

        const targetsHitThisActivation = new Set();
        let attackChainCount = 0;

        while (true) {
            attackChainCount++;
            // Determine available targets for this link in the chain
            let potentialTargetsForThisHit = initialLivingTargets.filter(t => !targetsHitThisActivation.has(t) && !t.isDefeatedStatus());

            if (potentialTargetsForThisHit.length === 0) {
                console.log("Savage Rush: No more valid targets to continue the chain or all targets hit.");
                break; // End chain if no valid, unhit targets remain
            }

            const currentTarget = potentialTargetsForThisHit[Math.floor(Math.random() * potentialTargetsForThisHit.length)];
            targetsHitThisActivation.add(currentTarget);

            console.log(`Savage Rush (Chain Link #${attackChainCount}): Targeting ${currentTarget.getName()}`);
            subActions.push(createAttackSubAction_SavageRush(currentTarget, attackChainCount));

            // Check bleeding status *of the chosen target* to decide chain continuation
            // This check happens conceptually "after" targeting but "before" the next chain link decision
            const isCurrentTargetBleeding = currentTarget.attachedEffects.some(effect => effect.type === 'bleed' && effect.isActive);

            if (!isCurrentTargetBleeding) {
                console.log(`${currentTarget.getName()} is not Bleeding. Savage Rush will apply Bleed and end the chain.`);
                subActions.push(createApplyBleedSubAction_SavageRush(currentTarget));
                break; // End chain
            } else {
                console.log(`${currentTarget.getName()} is Bleeding. Savage Rush chain continues...`);
                // If all targets have been hit, the loop will break at the start of the next iteration.
                if (targetsHitThisActivation.size >= initialLivingTargets.length) {
                    console.log("Savage Rush: All living targets have been hit once. Chain ends.");
                    break;
                }
            }
        }
        return subActions;
    } // End of skillSavageRush
}