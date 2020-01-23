
const Records = function Records()
{
    this.achievements = {
        playedTheGame: { title: "Played the game",                                  value: false },
        traveled10000: { title: "Traveled 10,0000 steps",                           value: false },
    }

    this.playerStats = {
        
        deaths: 0,
        stepsTaken: 0,
        timePlayed: 0,
        nanitesCollected: 0,

        currentLife:{
            //a step is moving left/right 8px, no falling/in air
            stepsTaken: 0,
            shotsFired: 0,
            timePlayed: 0,
            jumps: 0,

        },
        
    }
   
    return this;
}

Records.prototype.resetSession = function resetSession(){
    //reset currentLife stats, rollover numbers to totals if necessary
}

Records.prototype.update = function update(){

    if(this.achievements.playedTheGame.value == false){
        this.achievements.playedTheGame.value = true;
        G.MSG.dispatch("achievement", this.achievements.playedTheGame)
        console.log(this.achievements.playedTheGame)
    }
    if( this.playerStats.stepsTaken >= 10000 && !this.achievements.traveled10000.value ){
        this.achievements.traveled10000.value = true;
        G.MSG.dispatch("achievement", this.achievements.traveled10000 );
    }
}

export default Records;