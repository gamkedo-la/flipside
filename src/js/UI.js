import { range } from './math.js';
import G from './G.js';
let speaker;
let showMessageBox = false;
let showMessageText = 'text';

export function UIRender(){
    let {healthBarDimensions, healthBarLocation, healthBarColor, naniteBarDimensions, naniteBarLocation, naniteBarColor} = G;
        let healthBarPadding    = 1,
            naniteBarPadding = 1,
        healthBarDrawWidth  = range(G.player.health, 0, G.player.maxHealth, 0, healthBarDimensions.w-healthBarPadding*2);
    G.ctx.fillStyle = '#777';
    G.ctx.fillRect(healthBarLocation.x, healthBarLocation.y, healthBarDimensions.w, healthBarDimensions.h);
    G.ctx.fillStyle = '#444';
    G.ctx.fillRect(
            healthBarLocation.x + healthBarPadding,
            healthBarLocation.y+healthBarPadding,
            healthBarDimensions.w-healthBarPadding*2,
            healthBarDimensions.h-healthBarPadding*2
            );
   
    G.ctx.fillStyle = healthBarColor;
    G.ctx.fillRect(
        healthBarLocation.x + healthBarPadding,
        healthBarLocation.y+healthBarPadding,
        healthBarDrawWidth,
        healthBarDimensions.h-healthBarPadding*2
        );


    ///------draw nanite bar
    
    let naniteBarDrawWidth  = range(G.player.nanitesCollected, 0, G.player.nanitesMax, 0, naniteBarDimensions.w-naniteBarPadding*2);
    G.ctx.fillStyle = '#777';
    G.ctx.fillRect(naniteBarLocation.x, naniteBarLocation.y, naniteBarDimensions.w, naniteBarDimensions.h);
    G.ctx.fillStyle = '#444';
    G.ctx.fillRect(
            naniteBarLocation.x + naniteBarPadding,
            naniteBarLocation.y+naniteBarPadding,
            naniteBarDimensions.w-naniteBarPadding*2,
            naniteBarDimensions.h-naniteBarPadding*2
            );
   
    G.ctx.fillStyle = naniteBarColor;
    G.ctx.fillRect(
        naniteBarLocation.x + naniteBarPadding,
        naniteBarLocation.y+naniteBarPadding,
        naniteBarDrawWidth,
        naniteBarDimensions.h-naniteBarPadding*2
        );


    if (showMessageBox){
        handleMessageBox();
    }  
}
export function showMessage(withText){//work in progress
    showMessageText = withText;
    if (showMessageBox = false) {
        showMessageBox = true;
        stopGame = true;
        console.log("Press B to hide or show the Box");
    }else{ 
        showMessageBox = false ; 
    }
}


export function handleMessageBox(){
    let msgBoxX = 30;
    let msgBoxY = 160;
    let msgBoxTextX = msgBoxX + 30;
    let msgBoxTextY = msgBoxY + 30;
    G.ctx.drawImage(
        G.img.msgBox,
        msgBoxX,
        msgBoxY
        );
    G.gameFont.drawText({
        textString: showMessageText,
        pos: {x: msgBoxTextX, y: msgBoxTextY},
        spacing: 0
        }); 
    }
