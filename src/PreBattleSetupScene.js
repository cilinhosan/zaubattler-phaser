import Phaser from 'phaser';
import battlesData from './game/battles.json'; // Import battle data
import Character from './game/Character'; // Import Character class

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

        // --- Define Base Stats/Elements for Enemies ---
        // TODO: Move this to a separate configuration file or module later
        const enemyBaseStats = {
            wolf: { hp: 500, atk: 100, def: 30, element: 'Neutral' },
            werewolf: { hp: 700, atk: 100, def: 70, element: 'Dark' },
            red_ufo: { hp: 300, atk: 150, def: 30, element: 'Fire' }
            // Add other enemy types here
        };
        // --- End Base Stats ---

        const currentBattle = battlesData[battleIndex];
        const enemyTeam = currentBattle.enemies.map((enemyConfig, index) => {
            const base = enemyBaseStats[enemyConfig.type];
            if (!base) {
                console.warn(`Base stats for enemy type "${enemyConfig.type}" not found. Using defaults.`);
                base = { hp: 500, atk: 100, def: 30, element: 'Unknown' }; // Default fallback
            }

            // Simple scaling based on level (adjust as needed)
            const stats = {
                hp: base.hp + (enemyConfig.level - 1) * 10, // Example scaling
                atk: base.atk + (enemyConfig.level - 1) * 2,
                def: base.def + (enemyConfig.level - 1) * 1
            };
            const name = `${enemyConfig.type} Lvl ${enemyConfig.level}`; // More descriptive name
            const element = base.element;
            // Placeholder rectConfig - actual values set in BattleScene
            const rectConfig = { x: 0, y: 0, width: 0, height: 0 };

            // Create character with correct arguments
            const character = new Character(name, stats, element, rectConfig);
            // Store level and type directly on the character object if needed elsewhere
            character.level = enemyConfig.level;
            character.type = enemyConfig.type;
            return character;
        });
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
            // Pass playerTeam, the generated enemyTeam, and the current battleIndex
            this.scene.start('BattleScene', { playerTeam, enemyTeam, battleIndex });
        });
    }

    displayCharacterInfo(character) {
        // Adjust properties based on your Character class
        const info = `Name: ${character.name || character.type}\nLevel: ${character.level}\nElement: ${character.element || 'N/A'}\nHP: ${character.hp}\nATK: ${character.atk}\nDEF: ${character.def}`;
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