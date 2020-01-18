//Persistence Helper
const GameSaver = function GameSaver() {
    this.storageAllowed = true;
    try {
        let version = window.localStorage.getItem('flipside-version');
    } catch (error) {
        console.log("Saving game state requires local storage.  Please enable it and reload the game.");
        this.storageAllowed = false;
    }

    this.saves = {
        game1:null,
        game2:null,
        game3:null
    }

    this.GameSaveObject = function GameSaveObject() {
        this.map = 'room01';
        this.spawnPoint = "PlayerStart";
        this.maxHealth = 100;

        return this;
    }
}

GameSaver.prototype.getSavedGame = function getSavedGame(game) {
    if(this.saves[game] === undefined) {
//    if(this.saves[game] == undefined) {
        console.error(`Game Save: ${game} does not exist`);
        return this.saves.game1 = new this.GameSaveObject();
    } else if(this.saves[game] == null) {
        //Either this game save hasn't been retrieved yet, or no game has been saved to this slot yet
        if(this.storageAllowed) {
            this.saves[game] = JSON.parse(window.localStorage.getItem(`flipside-${game}`));
            if(this.saves[game] == undefined) {
                this.saves[game] = new this.GameSaveObject();
                window.localStorage.setItem(`flipside-${game}`, JSON.stringify(this.saves[game]));
            }
        } 
    } 
    
    return this.saves[game];
}

GameSaver.prototype.save = function save(game) {
    try {
        let version = window.localStorage.getItem('flipside-version');
        this.storageAllowed = true;
    } catch (error) {
        console.log("Saving the game requires access to local storage, please enable it and try again.");
        this.storageAllowed = false;
        return;
    }

    const thisGame = this.getSavedGame(game);
    thisGame.map = G.currentMap;
    thisGame.spawnPoint = G.world.spawnPoints[0];
    thisGame.maxHealth = G.player.maxHealth;

    const gameString = JSON.stringify(thisGame);
    window.localStorage.setItem(`flipside-${game}`, gameString);
    console.log(`Game Save Text:\n${gameString}`);
}

export default GameSaver;