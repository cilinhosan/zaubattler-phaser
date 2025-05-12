// src/character_definitions/OrcDefinition.js
import { CharacterDefinition, FACTION } from './BaseDefinitions.js';
import * as SkillHelper from '../game/SkillHelper.js';
import AttachedEffect from '../game/AttachedEffect.js';

// --- Define a specific effect for Thick Skin (DEF Boost) ---
class ThickSkinEffect extends AttachedEffect {
    constructor({ owner, sourceSkillId, defenseBonus }) {
        super({
            owner,
            type: 'passive_def_boost_orc',
            duration: Infinity,
            sourceSkillId,
            name: "Thick Skin",
            description: `Increases DEF by ${defenseBonus}.`,
            isBuff: true,
            isHidden: false,
        });
        this.defenseBonus = defenseBonus;
        this.applied = false;
    }

    onApply(context) {
        super.onApply(context);
        if (!this.applied) {
            this.owner.currentDef += this.defenseBonus;
            console.log(`${this.owner.name}'s Thick Skin boosted DEF by ${this.defenseBonus}. New DEF: ${this.owner.currentDef}`);
            this.applied = true;
        }
    }

    onExpire(context) {
        super.onExpire(context);
        // if (this.applied) { this.owner.currentDef -= this.defenseBonus; }
        console.log(`Thick Skin effect removed from ${this.owner.name} (if it were dispellable).`);
    }
}


export class OrcDefinition extends CharacterDefinition {
     constructor() {
        super({
            id: "orc",
            name: "Orc",
            stats: { hp: 600, atk: 110, def: 45, critChance: 0.10, critDamage: 1.60 }, // ATK increased to 110
            faction: FACTION.SEPIA,
            playableByPlayer: false,
            description: "A brutish Orc.",
            faceIconKey: 'default_character_icon',
            faceIconPath: 'assets/default_character_ilustration_face_icon.png',
            battleIconKey: 'default_enemy_icon',
            battleIconPath: 'assets/default_enemy_illustration_4_3.png'
        });

        this.skillMetadata = {
            skillHeavyStrike: { id: "orc_heavy_strike", name: "Heavy Strike", description: "Deals significant damage.", type: 'active', cooldown: 4, targetType: 'enemy' },
            skillThickSkin: { id: "orc_thick_skin", name: "Thick Skin", description: "Passive: Increases DEF.", type: 'passive', applyImmediately: true, modifiesStats: true }
        };
    }

     skillHeavyStrike(caster, targets, ownTeam, casterContext) {
        const battleScene = casterContext.scene;
        if (!battleScene) {
            console.error("OrcDefinition.skillHeavyStrike: BattleScene context not available!");
            return;
        }

        const livingTargets = targets.filter(t => t && !t.isDefeatedStatus());
        if (livingTargets.length > 0) {
            const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
            const damage = caster.currentAtk * 1.2; // 110 * 1.2 = 132
            console.log(`${caster.getName()} uses Heavy Strike on ${target.getName()}!`);
            SkillHelper.dealDamage(caster, target, Math.floor(damage), FACTION.SEPIA, { skillId: this.skillMetadata.skillHeavyStrike.id }, battleScene);
        } else {
            console.log(`${caster.getName()} used Heavy Strike, but no targets were available.`);
        }
    }

    skillThickSkin(caster, targetTeam, ownTeam, casterContext) {
        console.log(`${caster.getName()}'s Thick Skin passive is being initialized.`);
        const defenseBonus = 15; 

        const effect = new ThickSkinEffect({
            owner: caster,
            sourceSkillId: this.skillMetadata.skillThickSkin.id,
            defenseBonus: defenseBonus
        });
        caster.addAttachedEffect(effect);
    }
}