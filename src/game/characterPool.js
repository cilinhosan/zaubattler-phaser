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

const createCharacterPool = () => {
    // Deep copy baseStats to ensure each character gets its own stats object
    const getBaseStats = () => ({ ...baseStats });

    return [
        new Character("Alina", getBaseStats(), Elements.PLANT, {}),
        new Character("Bella", getBaseStats(), Elements.WATER, {}),
        new Character("Emilia", getBaseStats(), Elements.EARTH, {}),
        new Character("Meryl", getBaseStats(), Elements.FIRE, {}),
        new Character("Dorothy", getBaseStats(), Elements.DARK, {}),
        new Character("Elzette", getBaseStats(), Elements.LIGHT, {}),
    ];
};

export default createCharacterPool;