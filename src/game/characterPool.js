import Character from './Character';

const baseStats = { hp: 500, atk: 100, def: 30 };

const Elements = {
    PLANT: "Plant",
    WATER: "Water",
    EARTH: "Earth",
    FIRE: "Fire",
    LIGHT: "Light",
    DARK: "Dark"
};

const characterPool = [
    new Character("Alina", baseStats, Elements.PLANT, {}),
    new Character("Bella", baseStats, Elements.WATER, {}),
    new Character("Emilia", baseStats, Elements.EARTH, {}),
    new Character("Meryl", baseStats, Elements.FIRE, {}),
    new Character("Dorothy", baseStats, Elements.DARK, {}),
    new Character("Elzette", baseStats, Elements.LIGHT, {}),
];

export default characterPool;