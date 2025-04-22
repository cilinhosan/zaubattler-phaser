class Character {
    constructor(name, stats, element, rectConfig) {
        this.name = name;
        this.hp = stats.hp;
        this.atk = stats.atk;
        this.def = stats.def;
        this.element = element;
        this.rectX = rectConfig.x;
        this.rectY = rectConfig.y;
        this.rectWidth = rectConfig.width;
        this.rectHeight = rectConfig.height;
        this.level = 1;
    }
}

export default Character;