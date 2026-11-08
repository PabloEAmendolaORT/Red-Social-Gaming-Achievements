const games = [
  {
    "id": "pokemon-firered",
    "title": "Pokemon Fire Red",
    "system": "GBA",
    "unlockedAchievements": 1,
    "totalAchievements": 61
  },
  {
    "id": "ffta",
    "title": "Final Fantasy Tactics Advance",
    "system": "GBA",
    "unlockedAchievements": 15,
    "totalAchievements": 90
  },
  {
    "id": "wario-ware-twisted",
    "title": "WarioWare Twisted",
    "system": "GBA",
    "unlockedAchievements": 0,
    "totalAchievements": 35
  }
];

export function getGames() {
    return games;
};

export function getGameById(id) {
    return games.find(game => game.id === id);
}