//if we want to use the pixel font renderer here, font image assets will be need to be moved to
//img tags so they're loaded before document.ready

const loading = function Loading(dt){
    this.total = 0;
    this.loaded = 0;
    this.render = function render(dt){
        //if loaded != total
            //draw text "Loading..."
            //draw progress bar based on total-loading
        //if loaded == total
            //draw text "Click To Continue"
        
    };
    this.update = function update(dt){
        
        //get total initial maps, sounds, image counts from G.loader
        //populate Total var
        //update loaded count var

        //onClick
            //initialize audio context
            //switch scene to Title Screen
        
    }
}

export default loading;