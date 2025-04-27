import Phaser from 'phaser';

// Unused constants removed

class MenuCharacterDisplay extends Phaser.GameObjects.Container { // Inherit from Container
    constructor(scene, x, y, character) {
        super(scene, x, y); // Call Container constructor

        this.character = character;

        // Use fixed dimensions for the inventory display box
        this.rectWidth = 100; // Make it square, slightly larger than icon
        this.rectHeight = 100;

        // Store position relative to container (passed as x, y)
        // Note: Container's position is set by scene.add.existing(this) or similar
        // We draw elements relative to the container's origin (0,0)

        this.createDisplayElements();

        // Add the container itself to the scene (important!)
        // scene.add.existing(this) is handled by the parent container/scene
    }

    createDisplayElements() {
        // Graphics for the box and HP bar
        // --- Draw elements relative to the Container's origin (0,0) ---

        // Graphics for the box
        this.graphics = this.scene.add.graphics();
        this.graphics.lineStyle(2, 0xffffff, 1);
        // Draw at (0,0) relative to container
        this.graphics.strokeRect(0, 0, this.rectWidth, this.rectHeight);
        this.add(this.graphics); // Add graphics to the container

        // --- Add Icon ---
        // TODO: Use actual character icon if available, fallback to default
        // Get face icon key from definition, fallback to default character icon
        const definition = this.character.definition; // Assuming character instance has .definition
        const faceIconKey = definition?.faceIconKey || 'default_character_icon';
        try {
            // Ensure the icon key is valid and loaded
            if (this.scene.textures.exists(faceIconKey)) {
                // Center the 90x90 icon within the 100x100 box
                this.icon = this.scene.add.image(this.rectWidth / 2, this.rectHeight / 2, faceIconKey);
                this.icon.setDisplaySize(99, 99);
                this.add(this.icon); // Add icon to the container
            } else {
                 console.warn(`Face icon key '${faceIconKey}' not found for ${this.character.name}.`);
                 // Optionally add a placeholder graphic
            }
        } catch (e) {
            console.error(`Error creating icon for ${this.character.name}:`, e);
        }


        // Text for the character name (below the icon/box)
        const displayName = this.character.name || this.character.type || 'Unknown';
        this.text = this.scene.add.text(this.rectWidth / 2, this.rectHeight + 5, displayName, { // Position below box
            fontSize: '16px', // Smaller font for inventory
            fill: '#fff',
            align: 'center',
            wordWrap: { width: this.rectWidth - 10 } // Wrap text
        }).setOrigin(0.5, 0); // Origin at top-center
        this.add(this.text); // Add text to the container

        // HP bar/text removed as they are not used in menu display

        // Adjust container size based on content
        const textHeight = this.text.getBounds().height;
        // Set container size to include the box and the text below it
        this.setSize(this.rectWidth, this.rectHeight + 5 + textHeight);

        // Interaction is handled by the parent container (inventoryContainer in PreBattleSetupScene)
        // No need to setInteractive here directly
    }

    // updateHpDisplay method removed - not used in menu context

    // shake method removed - battle feedback not needed here

    // highlightBorder method removed - not used

    // clearHighlight method removed - not used

    // hide method removed - visibility handled by parent/scene logic if needed

    // show method removed - visibility handled by parent/scene logic if needed

    // Override destroy to ensure proper cleanup when removed from team slot or scene changes
    destroy(fromScene) {
        // Destroy children managed by this container
        // The graphics and text objects added via this.add() are automatically managed

        // Call the parent Container's destroy method
        super.destroy(fromScene);
    }

    // resetDisplay method removed - not used

    // showDefeated method removed - battle state not relevant here

} // End of class MenuCharacterDisplay

export default MenuCharacterDisplay;