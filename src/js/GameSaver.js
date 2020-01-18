//Persistence Helper
import Records from './records.js';

const GameSaver = function GameSaver() {
    this.storageAllowed = true;
    this.version = 0.1;
    this.persistedVersion;
    try {
        this.persistedVersion = parseFloat(window.localStorage.getItem('flipside-version'));
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
        //Add additional properties to save to this default object
        this.map = 'room01';
        this.spawnPoint = "PlayerStart";
        this.maxHealth = 100;
        this.Records = new Records();

        return this;
    }
}

GameSaver.prototype.getSavedGame = function getSavedGame(game) {
    if(this.saves[game] === undefined) {
        console.error(`Game Save: ${game} does not exist`);
        return this.saves.game1 = new this.GameSaveObject();
    } else if(this.saves[game] == null) {
        //Either this game save hasn't been retrieved yet, or no game has been saved to this slot yet
        if(this.storageAllowed) {
            this.saves[game] = JSON.parse(window.localStorage.getItem(`flipside-${game}`));
            if(this.saves[game] == undefined) {
                this.saves[game] = new this.GameSaveObject();
                window.localStorage.setItem(`flipside-${game}`, JSON.stringify(this.saves[game]));
            } else {
                //saved game existed on file, functions are not serialized, 
                //Need to create new Records object (which has these functions
                //and replace its data with retrieved data

                const newRecordsObj = new Records();
                if((this.persistedVersion == undefined) ||
                   (this.persistedVersion == null) ||
                   (isNaN(this.persistedVersion)) ||
                   (this.persistedVersion < this.version)) {
                    window.localStorage.setItem('flipside-version', `${this.version}`);
                } else {
                    const recordKeys = Object.keys(this.saves[game].Records);
                    for(let key of recordKeys) {
                        newRecordsObj[key] = this.saves[game].Records[key];
                    }
                }
                
                this.saves[game].Records = newRecordsObj;
            }
        } 
    } 
    
    return this.saves[game];
}

GameSaver.prototype.save = function save(game) {
    try {
        this.persistedVersion = parseFloat(window.localStorage.getItem('flipside-version'));
        this.storageAllowed = true;
    } catch (error) {
        console.log("Saving the game requires access to local storage, please enable it and try again.");
        this.storageAllowed = false;
        return;
    }

    const thisGame = this.getSavedGame(game);
    //Add properties which are saved for the game here.
    thisGame.map = G.currentMap;
    thisGame.spawnPoint = G.world.spawnPoints[0];
    thisGame.maxHealth = G.player.maxHealth;
    thisGame.Records = G.Records;

    const gameString = JSON.stringify(thisGame);
    window.localStorage.setItem(`flipside-${game}`, gameString);
    console.log(`Game Save Text:\n${gameString}`);
}

export default GameSaver;