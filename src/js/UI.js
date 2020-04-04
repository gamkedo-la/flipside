import { range } from './math.js';
import G from './G.js';
let speaker;
//var showMessageBox = true; //moved to G
let showMessageText = 'text';
let showMessageSpeaker = 0;
let msgBoxForSpeakerLookUp = [1,//msgBox style for no speaker
     2,//msgBox style for speaker 1
      1,//msgBox style for speaker 2...
       3
    ];//example speaker1 is messageBox [1] which is 2

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


    if (G.showMessageBox){
        handleMessageBox();
    }  
}
export function showMessage(withText, fromSpeaker = 0){//work in progress
        showMessageText = withText;
        showMessageSpeaker = fromSpeaker;
        G.showMessageBox = true;
        G.messageCooldown = 180;
}


export function handleMessageBox(){
    let msgBoxX = 30;
    let msgBoxY = 160;
    let faceX = msgBoxX + 10;
    let faceY = msgBoxY + 10;
    let msgBoxTextX = msgBoxX + 66;
    let msgBoxTextY = msgBoxY + 10;
    G.ctx.save();
    G.ctx.globalAlpha = 0.88;
    G.ctx.drawImage(
        G.img.msgBox1,
        msgBoxX,
        msgBoxY
        );
    if (showMessageSpeaker != 0) {
        G.ctx.drawImage(
            G.img.portraits,
            showMessageSpeaker * G.PORTRAIT_SIZE, 0, 
            G.PORTRAIT_SIZE, G.PORTRAIT_SIZE,
            faceX,
            faceY,
            G.PORTRAIT_SIZE, G.PORTRAIT_SIZE
            );
    }
    
    G.ctx.restore();
    G.gameFont.drawText({
        textString: showMessageText,
        pos: {x: msgBoxTextX, y: msgBoxTextY},
        spacing: 0
        }); 
    }
