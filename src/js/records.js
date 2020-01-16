const Records = function Records()
{
    this.achievements = {
        playedTheGame: { title: "Played the game",                                  value: 0 },
        traveled10000: { title: "Traveled 10,0000 steps",                           value: 0 },
    }

    this.playerStats = {
        totals: {
            deaths: 0,
            stepsTaken: 0,
            timePlayed: 0,
            nanitesCollected: 0,

        },
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

Records.resetSession = function resetSession(){
    //reset currentLife stats, rollover numbers to totals if necessary
}

export default Records;