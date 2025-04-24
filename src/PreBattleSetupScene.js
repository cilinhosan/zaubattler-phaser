import Phaser from 'phaser';
import battlesData from './game/battles.json'; // Import battle data
import BattleCharacter from './game/BattleCharacter.js'; // Use BattleCharacter for enemies in this scene
import { getCharacterDefinition } from './CharacterDefinitionList.js'; // Corrected import path
// LLM TODO: Check if MenuCharacter is needed here if playerTeam needs inspection/display beyond base stats
// import MenuCharacter from './game/MenuCharacter.js';
// LLM TODO: Remove skill imports if not used directly here anymore
// import { fireBlastSkill, atkBoostPassive } from './game/SkillDefinitions.js'; // Removed unused skill imports


class PreBattleSetupScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreBattleSetupScene' });
    }

    preload() {
        // Load assets if needed
        // this.load.image('background', 'assets/background.png');
        // Load enemy assets based on battles.json if necessary
        const enemyTypes = new Set();
        battlesData.forEach(battle => {
            battle.enemies.forEach(enemy => enemyTypes.add(enemy.type));
        });
        // Example: Load assets for unique enemy types
        // enemyTypes.forEach(type => this.load.image(type, `assets/${type}.png`));
    }

    create(data) {
        // this.add.image(400, 300, 'background'); // Add background if you have one

        const { playerTeam, battleIndex = 0 } = data; // Get playerTeam and battleIndex (default to 0)

        // --- Load Enemy Team based on battleIndex ---
        if (battleIndex >= battlesData.length) {
            console.error(`Invalid battleIndex: ${battleIndex}. No more battles defined.`);
            // Optionally, transition to an error scene or back to menu
            this.scene.start('MenuScreenScene');
            return;
        }

        const currentBattle = battlesData[battleIndex];

        // --- Create Enemy Team using BattleCharacter and Definitions ---
        console.log(`Creating enemies for Battle Index: ${battleIndex}, Battle ID: ${currentBattle.battleId}`);
        const enemyTeam = currentBattle.enemies.map((enemyConfig, index) => {
            console.log(`Processing enemy config:`, enemyConfig);
            const definitionId = enemyConfig.type.toLowerCase(); // Assuming type matches definition ID
            console.log(`Attempting to get definition for ID: ${definitionId}`);
            const definition = getCharacterDefinition(definitionId);

            if (!definition) {
                console.error(`Character definition not found for enemy type: ${enemyConfig.type}. Skipping enemy.`);
                // LLM TODO: Consider adding a placeholder 'Unknown Enemy' BattleCharacter
                return null; // Skip this enemy if definition is missing
            }

            // Create BattleCharacter instance using the definition ID
            // Level and team are set here. Skills and passives are handled by the constructor.
            console.log(`Definition found for ${definitionId}. Creating BattleCharacter...`);
            const battleCharacter = new BattleCharacter(definitionId, 1, 'enemy'); // Level 1, enemy team
            console.log(`Created BattleCharacter: ${battleCharacter.getName()}`);

            // LLM TODO: Potentially assign unique IDs or modify names if needed (e.g., "Goblin A", "Goblin B")
            // battleCharacter.name = `${definition.name} ${index + 1}`; // Example: Rename to Goblin 1, Goblin 2

            return battleCharacter;
        }).filter(character => character !== null); // Filter out any nulls from missing definitions
        // --- End Load Enemy Team ---


        // Display player team and stats
        // Adjusted position for 1080p
        this.add.text(200, 150, 'Your Team', { fontSize: '48px', fill: '#fff' }); // Increased font size

        playerTeam.forEach((character, index) => {
            // Adjusted position and font size
            const characterText = this.add.text(200, 250 + index * 80, `${character.name}`, { fontSize: '36px', fill: '#fff' }) // Increased font size and spacing
                .setInteractive();

            const textBounds = characterText.getBounds();
            const outline = this.add.graphics();
            outline.lineStyle(2, 0xffffff, 1);
            outline.strokeRect(textBounds.x - 5, textBounds.y - 5, textBounds.width + 10, textBounds.height + 10);

            characterText.on('pointerdown', () => {
                this.displayCharacterInfo(character);
            });
        });

        // Display enemy team and stats
        // Adjusted position for 1080p
        this.add.text(1200, 150, `Enemy Team (Battle ${currentBattle.battleId})`, { fontSize: '48px', fill: '#fff' }); // Increased font size

        enemyTeam.forEach((character, index) => {
            // Use the name generated during creation (e.g., "wolf Lvl 1")
            // Adjusted position and font size
            const characterText = this.add.text(1200, 250 + index * 80, character.name, { fontSize: '36px', fill: '#fff' }) // Increased font size and spacing
                .setInteractive();

            const textBounds = characterText.getBounds();
            const outline = this.add.graphics();
            outline.lineStyle(2, 0xffffff, 1);
            outline.strokeRect(textBounds.x - 5, textBounds.y - 5, textBounds.width + 10, textBounds.height + 10);

            characterText.on('pointerdown', () => {
                this.displayCharacterInfo(character);
            });
        });

        // Create a text object to display character information
        // Adjusted position, font size, and word wrap width
        this.characterInfoText = this.add.text(1500, 600, '', { fontSize: '24px', fill: '#fff', wordWrap: { width: 300 } }); // Increased font size and word wrap
        this.characterInfoOutline = this.add.graphics();
        this.characterInfoOutline.lineStyle(2, 0xffffff, 1);

        // Add a button to start the battle
        // Adjusted position and font size
        const startBattleButton = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 150, 'Start Battle', { fontSize: '64px', fill: '#0f0' }) // Increased font size and moved lower
            .setOrigin(0.5)
            .setInteractive();

        const buttonBounds = startBattleButton.getBounds();
        const buttonOutline = this.add.graphics();
        buttonOutline.lineStyle(2, 0xffffff, 1);
        buttonOutline.strokeRect(buttonBounds.x - 5, buttonBounds.y - 5, buttonBounds.width + 10, buttonBounds.height + 10);


        startBattleButton.on('pointerdown', () => {
            // --- Convert playerTeam to BattleCharacter instances ---
            // Assumes playerTeam contains objects with definitionId and level properties
            // (e.g., MenuCharacter instances or plain objects from previous scene)
            const playerBattleTeam = playerTeam.map(charData => {
                if (!charData || !charData.definitionId) {
                     console.error("Invalid character data in playerTeam:", charData);
                     // LLM TODO: Handle this case - skip character, use default, or throw error?
                     return null; // Skip invalid character data
                }
                // Create a new BattleCharacter for the battle
                return new BattleCharacter(charData.definitionId, charData.level || 1, 'player');
            }).filter(char => char !== null); // Filter out nulls

            if (playerBattleTeam.length === 0) {
                console.error("Player team is empty or invalid after conversion. Cannot start battle.");
                // LLM TODO: Show an error message to the player?
                return;
            }

            // Pass the converted playerBattleTeam and the generated enemyTeam
            this.scene.start('BattleScene', { playerTeam: playerBattleTeam, enemyTeam, battleIndex });
        });
    }

    displayCharacterInfo(character) {
        // Display info available on BaseCharacter, suitable for both MenuCharacter and BattleCharacter
        // Use base stats as current battle stats (hp, atk, def) might not be relevant/available here
        // especially if the player team consists of MenuCharacters.
        const info = `Name: ${character.getName()}\nLevel: ${character.getLevel()}\nElement: ${character.getElement() || 'N/A'}\nBase HP: ${character.getBaseStat('hp')}\nBase ATK: ${character.getBaseStat('atk')}\nBase DEF: ${character.getBaseStat('def')}`;
        this.characterInfoText.setText(info);

        const infoBounds = this.characterInfoText.getBounds();
        this.characterInfoOutline.clear();
        this.characterInfoOutline.lineStyle(2, 0xffffff, 1);
        this.characterInfoOutline.strokeRect(infoBounds.x - 5, infoBounds.y - 5, infoBounds.width + 10, infoBounds.height + 10);
    }

    update() {
        // Update logic if needed
    }
}

export default PreBattleSetupScene;