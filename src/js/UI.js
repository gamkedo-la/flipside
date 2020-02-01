import { range } from './math.js';
let speaker;
let showMessageBox = false;
let showMessageText = 'text';

export function UIRender(){
    let healthBarLocation   = {x: 4, y: 4},
        healthBarDimensions = {w: 50, h: 8},
        healthBarPadding    = 1,
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
    //test by setting lower than full
    //G.player.health = 75;
    G.ctx.fillStyle = '#4f0'
    G.ctx.fillRect(
        healthBarLocation.x + healthBarPadding,
        healthBarLocation.y+healthBarPadding,
        healthBarDrawWidth,
        healthBarDimensions.h-healthBarPadding*2
        );
    if (showMessageBox){
        handleMessageBox();
    }  
}
export function showMessage(withText){//work in progress
    showMessageBox = true;
    showMessageText = withText;
}
export function handleMessageBox(){
    let msgBoxX = 50;
    let msgBoxY = 50;
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
