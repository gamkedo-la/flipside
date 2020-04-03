//Credit Screen
const Credits = function Credits() {

    // next 2 are for hacky menu input toggle
    this.showCreditsToggleLock = false;
    this.showCreditsNow = false;


    this.creditsMaxCharWidthToWrap = 68;
    this.creditsScrollRate = 0.48;

    this.creditNameList = [
    " "," "," ",
"Ryan Malm: Project lead, main concept, core gameplay, flipspace growth, main level design (incl. hub), minimap, title screen, pixel fonts, additional player animations (EV suit, death, no gun crouch/idle), powerup effects, tiles (dirt), many player sounds, hover tooltips, portrait work, assorted bug fixes, map editor integration, UI design, bullet motion/collision, pooling, achievements, doors, boss concept, flying enemies, flipspace jetpack, parallax, environmental hazards, camera tracking"," ",
"H Trayford: GL renderer and all related fixes/optimizations, level design (Room04, Room06, Room13), flipspace distortion effect, hitbox fixes, health pickups visual, particle system improvements, flip slime, inverted plant tiles, hit flash, flip bird collisions, flip pig integration, flip crawler sprite, game save, level load/unload improvements"," ",
"Christer \"McFunkypants\" Kaitila: Level design (final battle room, mountain bunker, Room10, Room07), robo tank (animation, AI, attack), switch puzzle triggers, tiles (greebles, panels, bolts, lights, tech) text wave effect, audio browser compatibility improvements, warp pads, gamepad support, ladders, glyph tiles, hub signs, additional sound integration, loading progress bar, flip spider, various effects (bolt thrower, landing, muzzle flash, sparks, flamethrower), additional error checking, assorted generated sounds"," ",
"Marc Silva: Player design improvements, jump/fall animations, air control fix, crouch, additional pause screen details, art and code for aiming up"," ",
"Andrew Mushel: Player top collision, gravity fix, rate of fire control, shot reallocation on death"," ",
"Jeff \"Axphin\" Hanlon: 5+ tilesets, song (\"Vanishing\"), enemy Slime animations, portraits art "," ",
"Klaim (A. Joël Lamotte): Music in 4 variations (\"Layers of Cool Lasers\")"," ",
"Michael \"Misha\" Fewkes: Audio implementation (advanced; spatialization, ducking, track swapping, and more), volume controls"," ",
"Stebs: Creepy synthwave track"," ",
"Vaan Hope Khani: Assorted sound effects (environment, enemy, attacks, interface, pickups, and more), main dialog box functionality"," ",
"Michelly-Michelly Oliveira: Drone logic"," ",
"Gonzalo Delgado: Blue pipes tiles, OS compatibility fix"," ",
"Jeremiah Franczyk: Animations (walk, idle, with and without gun), initial EV suit"," ",
"Matthew \"McCordinator\" McCord: Pause menu, blocked movement while crouching"," ",
"Practice commits: Ian Cherabier, Simon J Hoffiz",
    " ",
    " ",
    "Made by members of HomeTeam GameDev (Apollo!)"," ","Join at", "HomeTeamGameDev.com", "to make games with us!",
    " ",
    " ",
    ];

    this.creditsScroll = 0;

    return this;
}

Credits.prototype.handleCToggle = function handleCToggle() {
    if(Key.isDown(Key.c)){
        if(this.showCreditsToggleLock==false) {
            this.showCreditsToggleLock = true;
        }
    } else {
        if(this.showCreditsToggleLock) {
            this.showCreditsNow = !this.showCreditsNow;
        }
        this.showCreditsToggleLock = false;
    }
}

Credits.prototype.drawCredits = function drawCredits(){
    var posHeight = 180;
    var count = 0;
    G.ctx.fillStyle="black";
    G.ctx.fillRect(0,0,G.c.width,G.c.height);

    var anyDrew = false;
    for (count; count < this.creditNameList.length; count++){
        var drawAt = posHeight+count*18-this.creditsScroll;
        var snappedY = Math.floor(drawAt);
        if(drawAt > 10 && drawAt < 218) {
            G.gameFont.drawText({textString:this.creditNameList[count],
                    pos: {x: 10, y: snappedY},
                    spacing: 0});
            anyDrew = true;
        }
    }
    G.gameFont.drawText({
        textString: 'press c to exit credits ',
        pos: { x: 135, y: 228 },
        spacing: 0
        });
    this.creditsScroll+=this.creditsScrollRate;
    if(anyDrew==false) { // reset, all off screen
        this.creditsScroll=0;
    }
}

Credits.prototype.wrapCredits = function wrapCredits(){ // note: gets calling immediately after definition
    var newCut = [];
    var findEnd;
    for(var i=0;i<this.creditNameList.length;i++) {
        while(this.creditNameList[i].length > 0) {
            findEnd = this.creditsMaxCharWidthToWrap;
            if(this.creditNameList[i].length > this.creditsMaxCharWidthToWrap) {
                for(var ii=findEnd;ii>0;ii--) {
                    if(this.creditNameList[i].charAt(ii) == " ") {
                        findEnd=ii;
                        break;
                    }
                }
            }
            newCut.push(this.creditNameList[i].substring(0, findEnd));
            this.creditNameList[i] = this.creditNameList[i].substring(findEnd, this.creditNameList[i].length);
        }
    }
    this.creditNameList = newCut;
}

export default Credits;