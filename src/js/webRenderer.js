import GLTextureManager from './GLTextureManager.js';
import vertexDataBuilder from './vertexDataBuilder.js';
import indexDataBuilder from './indexDataBuilder.js';
import textureCoordinateBuilder from './textureCoordinateBuilder.js';
import G from './G.js';

//Make some webGL stuff here
const WebRenderer = function WebRenderer(widthInTiles, heightInTiles, tileImage, bkgdImage, flipImage) {
    //------Set up some basic constants---------//
    const TILE_SIZE = 8;
    const MAX_ENTITIES = 50;//assume no more than 49 enemies on screen at the same time
    const BRIGHTNESS = 155.0 / 255.0;
    let BASELINE = null;//Need a reference frame for flipspace 'waviness' effect to prevent jumping from affecting it
    const webCanvas = document.createElement('canvas');
    webCanvas.width = widthInTiles * TILE_SIZE;
    webCanvas.height = heightInTiles * TILE_SIZE;
    const w = TILE_SIZE / tileImage.width;  //width of a tile in Texture Coordinate space
    const h = TILE_SIZE / tileImage.height; //height of a tile in Texture Coordinate space

    const widthInBKGDs = Math.ceil(webCanvas.width / bkgdImage.width);
    const heightInBKGDs = Math.ceil(webCanvas.height / bkgdImage.height);

    const sourceWidthInTiles = tileImage.width / TILE_SIZE;
    const tileDelta = new Float32Array(2).fill(0);
    const bkgdDelta = new Float32Array(2).fill(0);

    const locations = {tile:{}, flip:{}, entity:{}};
    const entities = {player:{}, EnemyTinyflyer:{}, EnemyTinycrawler:{}, EnemyTinydiver:{}, EnemyTinydrone:{}, EnemyFlipTank:{}, EnemyRoboTank:{}, EnemyFlipSlime:{}, flipspider:{}};
    
    //------Get WebGL---------//
    let gl = webCanvas.getContext('webgl');
    if(!gl) {
        gl = webCanvas.getContext('experimental-webgl');
    }

    if(!gl) {
        console.error("WebGL not supported");
    }

    //------Set up the textures we're going to use---------//
    const texManager = new GLTextureManager(gl);
    const tileTexture = texManager.setUpTexture(tileImage);
    const bkgdTexture = texManager.setUpTexture(bkgdImage);
    const flipTexture = texManager.setUpTexture(flipImage);
    let frameBuffTexIndex = null;
    const frameBuffTex = gl.createTexture();
//    let entityTexture;//FIXME: Right now just using the player texture
    
    //------Set up the geometry, one quad per tile---------//
    let vertexCount = 0;//not just vertsPerRow * numRows because we revisit some vertices and they need to be counted
    const vertexGenerator = new vertexDataBuilder();
    const tileVertexData = vertexGenerator.generateQuads(widthInTiles, heightInTiles, -1, 1);

    let startX = -((widthInBKGDs * bkgdImage.width) - webCanvas.width) / 2;
    startX = -1 + startX / webCanvas.width;
    let startY = ((heightInBKGDs * bkgdImage.height) - webCanvas.height) / 2;
    startY = 1 + startY / webCanvas.height;
    const bkgdVertexData = vertexGenerator.generateQuads(widthInBKGDs, heightInBKGDs, startX, startY);
    const entityVertexData = new Float32Array(8 * MAX_ENTITIES).fill(0);
    const entityPosData = new Float32Array(8 * MAX_ENTITIES).fill(0);

    const tileVertexBuffer = gl.createBuffer();
    const bkgdVertexBuffer = gl.createBuffer();
    const entityVertexBuffer = gl.createBuffer();
    const entityPosBuffer = gl.createBuffer();

    //------Set up index arrays so we draw elements---------//
    const indexBuilder = new indexDataBuilder();
    const tileIndexData = indexBuilder.generateIndices(widthInTiles * heightInTiles);
    vertexCount = tileIndexData.length;
    const bkgdIndexData = indexBuilder.generateIndices(widthInBKGDs * heightInBKGDs);
    const flipColorData = new Float32Array(3 * tileVertexData.length).fill(0.0);//not index data, holds color data for each vertex
    const flipIndexData = new Uint16Array(tileIndexData.length).fill(0);
    const entityIndexData = indexBuilder.generateIndices(6 * MAX_ENTITIES);

    const tileIndexBuffer = gl.createBuffer();
    const bkgdIndexBuffer = gl.createBuffer();
    const flipColorBuffer = gl.createBuffer();//not a buffer for index data
    const flipIndexBuffer = gl.createBuffer();
    const entityIndexBuffer = gl.createBuffer();

    //------Set up texture coordinate arrays so we can sample textures---------//
    const texCoordinator = new textureCoordinateBuilder();

    const tileTexCoords = new Float32Array(8 * widthInTiles * heightInTiles).fill(0);
    const tileTexCoordBuffer = gl.createBuffer();

    const bkgdTexCoords = new Float32Array(8 * widthInBKGDs * heightInBKGDs).fill(0);
    texCoordinator.generateBKDGCoords(bkgdTexCoords, widthInBKGDs * heightInBKGDs);
    const bkgdTexCoordBuffer = gl.createBuffer();

    const fbTexCoords = new Float32Array(8 * widthInTiles * heightInTiles).fill(0);
    texCoordinator.generateFlipCoords(widthInTiles, heightInTiles, fbTexCoords);
    const fbTexCoordBuffer = gl.createBuffer();

    const leftTexCoords = new Float32Array(8 * widthInTiles * heightInTiles).fill(0);
    const leftTexCoordBuffer = gl.createBuffer();
    const topTexCoords = new Float32Array(8 * widthInTiles * heightInTiles).fill(0);
    const topTexCoordBuffer = gl.createBuffer();
    const rightTexCoords = new Float32Array(8 * widthInTiles * heightInTiles).fill(0);
    const rightTexCoordBuffer = gl.createBuffer();
    const bottomTexCoords = new Float32Array(8 * widthInTiles * heightInTiles).fill(0);
    const bottomTexCoordBuffer = gl.createBuffer();

    const entityTexCoords = new Float32Array(8 * MAX_ENTITIES).fill(0);
    const entityTexCoordBuffer = gl.createBuffer();
    const entityBrightData = new Float32Array(4 * MAX_ENTITIES).fill(0);
    const entityBrightBuffer = gl.createBuffer();


    //------Build the Vertex and Fragment Shaders--------//
    const getVertexShaderString = function() {
        //This is the vertex shader used for the background and tile layers

        return `
        precision mediump float;

        uniform vec2 delta;

        attribute vec2 vertPosition;
        attribute vec2 aTextureCoord;

        varying vec2 vTextureCoord;

        void main() {
            gl_Position = vec4(vertPosition.x + delta.x, vertPosition.y + delta.y, 0.0, 1.0);
            vTextureCoord = aTextureCoord;
        }
        `;
    }

    const getFragmentShaderString = function() {
        //this is the fragment shader used for the background and tile layers

        return `
        precision mediump float;

        varying vec2 vTextureCoord;

        uniform sampler2D sampler;

        void main(void) {
            gl_FragColor = texture2D(sampler, vTextureCoord);
        }
        `;
    }

    const getFlipVertShaderString = function() {
        //This is the vertex shader used for the background and tile layers 

        return `
        precision mediump float;

        uniform vec2 delta;
        uniform float deltaFBCoord;

        attribute vec2 vertPosition;
        attribute vec3 flipColor;
        attribute vec2 fbCoords;
        attribute vec2 lCoords;
        attribute vec2 tCoords;
        attribute vec2 rCoords;
        attribute vec2 bCoords;

        varying vec3 overlayColor;
        varying vec2 frameBuffCoords;
        varying vec2 leftCoords;
        varying vec2 topCoords;
        varying vec2 rightCoords;
        varying vec2 bottomCoords;

        void main() {
            float flipDelta = 0.00777777 * sin(12.5663706 * (vertPosition.y + deltaFBCoord));
            gl_Position = vec4(vertPosition.x + delta.x, vertPosition.y + delta.y, 0.0, 1.0);

            frameBuffCoords = vec2(fbCoords.x + flipDelta + delta.x / 2.0, fbCoords.y + delta.y / 2.0);
            leftCoords = lCoords;
            topCoords = tCoords;
            rightCoords = rCoords;
            bottomCoords = bCoords;
            overlayColor = flipColor;
        }
        `;
    }

    const getFlipFragShaderString = function() {
        //this is the fragment shader used for the background and tile layers

        return `
        precision mediump float;

        uniform sampler2D frameBuffSampler;
        uniform sampler2D flipSampler;

        varying vec3 overlayColor;
        varying vec2 frameBuffCoords;
        varying vec2 leftCoords;
        varying vec2 topCoords;
        varying vec2 rightCoords;
        varying vec2 bottomCoords;

        void main(void) {
            vec4 leftColor = texture2D(flipSampler, leftCoords);
            vec4 topColor = texture2D(flipSampler, topCoords);
            vec4 rightColor = texture2D(flipSampler, rightCoords);
            vec4 bottomColor = texture2D(flipSampler, bottomCoords);

            vec4 baseColor = texture2D(frameBuffSampler, frameBuffCoords);

            if(baseColor.r < 0.5) {
                gl_FragColor.r = 2.0 * baseColor.r * overlayColor.r;
            } else {
                gl_FragColor.r = 1.0 - 2.0 * (1.0 - baseColor.r) * (1.0 - overlayColor.r);
            }
            
            if(baseColor.g < 0.5) {
                gl_FragColor.g = 2.0 * baseColor.g * overlayColor.g;
            } else {
                gl_FragColor.g = 1.0 - 2.0 * (1.0 - baseColor.g) * (1.0 - overlayColor.g);
            }
            
            if(baseColor.b < 0.5) {
                gl_FragColor.b = 2.0 * baseColor.b * overlayColor.b;
            } else {
                gl_FragColor.b = 1.0 - 2.0 * (1.0 - baseColor.b) * (1.0 - overlayColor.b);
            }
            
            gl_FragColor.a = 1.0;

            gl_FragColor.r = gl_FragColor.r * (1.0 - leftColor.a) + leftColor.r * (leftColor.a);
            gl_FragColor.g = gl_FragColor.g * (1.0 - leftColor.a) + leftColor.g * (leftColor.a);
            gl_FragColor.b = gl_FragColor.b * (1.0 - leftColor.a) + leftColor.b * (leftColor.a);
        
            gl_FragColor.r = gl_FragColor.r * (1.0 - topColor.a) + topColor.r * (topColor.a);
            gl_FragColor.g = gl_FragColor.g * (1.0 - topColor.a) + topColor.g * (topColor.a);
            gl_FragColor.b = gl_FragColor.b * (1.0 - topColor.a) + topColor.b * (topColor.a);
        
            gl_FragColor.r = gl_FragColor.r * (1.0 - rightColor.a) + rightColor.r * (rightColor.a);
            gl_FragColor.g = gl_FragColor.g * (1.0 - rightColor.a) + rightColor.g * (rightColor.a);
            gl_FragColor.b = gl_FragColor.b * (1.0 - rightColor.a) + rightColor.b * (rightColor.a);
        
            gl_FragColor.r = gl_FragColor.r * (1.0 - bottomColor.a) + bottomColor.r * (bottomColor.a);
            gl_FragColor.g = gl_FragColor.g * (1.0 - bottomColor.a) + bottomColor.g * (bottomColor.a);
            gl_FragColor.b = gl_FragColor.b * (1.0 - bottomColor.a) + bottomColor.b * (bottomColor.a);
        }
        `;
    }

    const getEntityVertexShaderString = function() {
        return `
            precision mediump float;

            attribute vec2 deltaPos;
            attribute vec2 vertPosition;
            attribute vec2 aTextureCoord;
            attribute float bright;

            varying vec2 vTextureCoord;
            varying float brightness;

            void main() {
                gl_Position = vec4(vertPosition.x + deltaPos.x, vertPosition.y + deltaPos.y, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
                brightness = bright;
            }
        `;
    }

    const getEntityFragShaderString = function() {
        return `
            precision mediump float;

            varying vec2 vTextureCoord;
            varying float brightness;

            uniform sampler2D sampler;

            void main(void) {
                gl_FragColor = texture2D(sampler, vTextureCoord);
                gl_FragColor.r = clamp(gl_FragColor.r + brightness, 0.0, 1.0);
                gl_FragColor.g = clamp(gl_FragColor.g + brightness, 0.0, 1.0);
                gl_FragColor.b = clamp(gl_FragColor.b + brightness, 0.0, 1.0);
            }
        `;
    }

    //------Build a program using the two shaders--------//
    const getWebGLProgram = function(vertShaderString, fragShaderString) {
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertexShader, vertShaderString);
        gl.shaderSource(fragmentShader, fragShaderString);

        gl.compileShader(vertexShader);
        if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error("Error compiling Vertex Shader", gl.getShaderInfoLog(vertexShader));
            return null;
        }

        gl.compileShader(fragmentShader);
        if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error("Error compiling Fragment Shader", gl.getShaderInfoLog(fragmentShader));
            return null;
        }

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);
        if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Error linking program", gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    const getLocations = function(program, attribs, uniforms) {
        if(program == tileProgram) {
            for(let i = 0; i < attribs.length; i++) {
                locations.tile[attribs[i]] = gl.getAttribLocation(tileProgram, attribs[i]);
            }

            for(let i = 0; i < uniforms.length; i++) {
                locations.tile[uniforms[i]] = gl.getUniformLocation(tileProgram, uniforms[i]);
            }
        } else if(program == flipProgram) {
            for(let i = 0; i < attribs.length; i++) {
                locations.flip[attribs[i]] = gl.getAttribLocation(flipProgram, attribs[i]);
            }

            for(let i = 0; i < uniforms.length; i++) {
                locations.flip[uniforms[i]] = gl.getUniformLocation(flipProgram, uniforms[i]);
            }
        }  else if(program == entityProgram) {
            for(let i = 0; i < attribs.length; i++) {
                locations.entity[attribs[i]] = gl.getAttribLocation(entityProgram, attribs[i]);
            }

            for(let i = 0; i < uniforms.length; i++) {
                locations.entity[uniforms[i]] = gl.getUniformLocation(entityProgram, uniforms[i]);
            }
        }
    }

    const tileProgram = getWebGLProgram(getVertexShaderString(), getFragmentShaderString());
    getLocations(tileProgram, ["vertPosition", "aTextureCoord"], ["delta", "sampler"]);
    const flipProgram = getWebGLProgram(getFlipVertShaderString(), getFlipFragShaderString());
    getLocations(flipProgram, ["vertPosition", "fbCoords", "lCoords", "tCoords", "rCoords", "bCoords", "flipColor"], ["delta", "frameBuffSampler", "flipSampler", "deltaFBCoord"]);
    const entityProgram = getWebGLProgram(getEntityVertexShaderString(), getEntityFragShaderString());
    getLocations(entityProgram, ["vertPosition", "aTextureCoord", "deltaPos", "bright"], ["sampler"])

    //------A function to link and enable attribute data--------//
    const setAttribData = function(buffer, data, location, elementCount = 2, drawHint = gl.STATIC_DRAW, type = gl.FLOAT, stride = 0, offset = 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, drawHint);

        gl.vertexAttribPointer(
            location, //Attribute location
            elementCount, //number of elements per attribute
            type, //Type of the elements
            gl.FALSE, //Is data normalized?
            stride * Float32Array.BYTES_PER_ELEMENT, //Stride
            offset * Float32Array.BYTES_PER_ELEMENT //Offset into buffer for first element of this type
        );

        gl.enableVertexAttribArray(location);
    }

    //------Set up WebGL to use the uniforms and attributes necessary to draw the background tiles--------//
    const setUpBkgdAttribs = function() {
        setAttribData(bkgdVertexBuffer, bkgdVertexData, locations.tile.vertPosition);
        
        gl.uniform2fv(locations.tile.delta, bkgdDelta);

        // Tell the shader we bound the texture to texture unit 1
        gl.uniform1i(locations.tile.sampler, bkgdTexture);

        setAttribData(bkgdTexCoordBuffer, bkgdTexCoords, locations.tile.aTextureCoord);
    }

    //------Set up WebGL to use the uniforms and attributes necessary to draw the main tiles--------//
    const setUpTileAttribs = function(tileData, deltaX, deltaY) {
        setAttribData(tileVertexBuffer, tileVertexData, locations.tile.vertPosition);

        tileDelta[0] = -(Math.round(deltaX)) / (4 * widthInTiles);
        tileDelta[1] = Math.round(deltaY) / (4 * heightInTiles);
        gl.uniform2fv(locations.tile.delta, tileDelta);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(locations.tile.sampler, tileTexture);

        texCoordinator.generateTileCoords(sourceWidthInTiles, w, h, tileData, tileTexCoords);

        setAttribData(tileTexCoordBuffer, tileTexCoords, locations.tile.aTextureCoord);
    }
    //------Set up WebGL to use the uniforms and attributes necessary to draw flipspace--------//
    let flipDelta = 0.0;
    const setUpFlipAttribs = function() {
        setAttribData(tileVertexBuffer, tileVertexData, locations.flip.vertPosition);

        gl.uniform2fv(locations.flip.delta, tileDelta);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(locations.flip.frameBuffSampler, frameBuffTexIndex);

        setAttribData(fbTexCoordBuffer, fbTexCoords, locations.flip.fbCoords);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(locations.flip.flipSampler, flipTexture);

        setAttribData(leftTexCoordBuffer, leftTexCoords, locations.flip.lCoords);

        setAttribData(topTexCoordBuffer, topTexCoords, locations.flip.tCoords);

        setAttribData(rightTexCoordBuffer, rightTexCoords, locations.flip.rCoords);

        setAttribData(bottomTexCoordBuffer, bottomTexCoords, locations.flip.bCoords);

        setAttribData(flipColorBuffer, flipColorData, locations.flip.flipColor, 3);

        flipDelta += 1.0;
        if(flipDelta > 288.0) flipDelta -= 288.0;
        gl.uniform1f(locations.flip.deltaFBCoord, (flipDelta - Math.round(2*(G.view.y - BASELINE))) / 288.0);
    }

    const setUpEntityAttribs = function(playerBright, playerFrame, enemies) {
        //frameNumber, frameWidth, frameTop, frameHeight, textureWidth, textureHeight, entityIndex, entityTexCoords
        texCoordinator.generateEntityCoords(playerFrame, entities.player.frameWidth, entities.player.frameY, entities.player.frameHeight, entities.textureWidth, entities.textureHeight, 0, entityTexCoords);

        if(enemies != null) {
            for(let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                const key = enemy.type;
                entityVertexData[(8 * (i + 1)) + 0] = entities[key].vert_x1;
                entityVertexData[(8 * (i + 1)) + 1] = entities[key].vert_y1;
                entityVertexData[(8 * (i + 1)) + 2] = entities[key].vert_x2;
                entityVertexData[(8 * (i + 1)) + 3] = entities[key].vert_y1;
                entityVertexData[(8 * (i + 1)) + 4] = entities[key].vert_x1;
                entityVertexData[(8 * (i + 1)) + 5] = entities[key].vert_y2;
                entityVertexData[(8 * (i + 1)) + 6] = entities[key].vert_x2;
                entityVertexData[(8 * (i + 1)) + 7] = entities[key].vert_y2;

                texCoordinator.generateEntityCoords(enemy.frame, entities[key].frameWidth, entities[key].frameY, entities[key].frameHeight, entities.textureWidth, entities.textureHeight, i + 1, entityTexCoords);

                if(enemy.isBright) {
                    entityBrightData[(4 * (i + 1)) + 0] = BRIGHTNESS;
                    entityBrightData[(4 * (i + 1)) + 1] = BRIGHTNESS;
                    entityBrightData[(4 * (i + 1)) + 2] = BRIGHTNESS;
                    entityBrightData[(4 * (i + 1)) + 3] = BRIGHTNESS;
                } else {
                    entityBrightData[(4 * (i + 1)) + 0] = 0.0;
                    entityBrightData[(4 * (i + 1)) + 1] = 0.0;
                    entityBrightData[(4 * (i + 1)) + 2] = 0.0;
                    entityBrightData[(4 * (i + 1)) + 3] = 0.0;
                }
            }    
        }

        setAttribData(entityVertexBuffer, entityVertexData, locations.entity.vertPosition);
        setAttribData(entityPosBuffer, entityPosData, locations.entity.deltaPos);

        // Tell the shader which texture point we bound the combined entity texture to 
//        gl.uniform1i(locations.entity.sampler, entityTexture);
        gl.uniform1i(locations.entity.sampler, entities.texture);

        setAttribData(entityTexCoordBuffer, entityTexCoords, locations.entity.aTextureCoord);

        if(playerBright) {
            entityBrightData[0] = BRIGHTNESS;
            entityBrightData[1] = BRIGHTNESS;
            entityBrightData[2] = BRIGHTNESS;
            entityBrightData[3] = BRIGHTNESS;
        } else {
            entityBrightData[0] = 0.0;
            entityBrightData[1] = 0.0;
            entityBrightData[2] = 0.0;
            entityBrightData[3] = 0.0;
        }

        setAttribData(entityBrightBuffer, entityBrightData, locations.entity.bright, 1);
    }

    const drawBackground = function(deltaX, deltaY) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bkgdIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bkgdIndexData, gl.STATIC_DRAW);

        setUpBkgdAttribs(deltaX, deltaY);

        gl.drawElements(
            gl.TRIANGLES, //what to draw triangle strip? triangle fan?
            bkgdIndexData.length, //how many vertexes are we drawing?
            gl.UNSIGNED_SHORT, //what kind of data are we drawing
            0 //how far into the element array buffer are we going to start drawing?
        );
    }

    const drawTiles = function(tileData, deltaX, deltaY) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tileIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tileIndexData, gl.STATIC_DRAW);

        setUpTileAttribs(tileData, deltaX, deltaY);
        
        gl.drawElements(
            gl.TRIANGLES, //what to draw triangle strip? triangle fan?
            vertexCount, //how many vertexes are we drawing?
            gl.UNSIGNED_SHORT, //what kind of data are we drawing
            0 //how far into the element array buffer are we going to start drawing?
        );

        frameBuffTexIndex = texManager.copyFrameBuffer(frameBuffTex, frameBuffTexIndex);
    }

    const drawFlipspace = function(flipIndices) {
        const drawCount = vertexGenerator.generateFlipColors(flipIndices, flipColorData, flipIndexData);
        texCoordinator.generateFlipEdgeCoords(widthInTiles, flipIndices, leftTexCoords, topTexCoords, rightTexCoords, bottomTexCoords);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, flipIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, flipIndexData, gl.STATIC_DRAW);

        setUpFlipAttribs();

        gl.drawElements(
            gl.TRIANGLES, //what to draw triangle strip? triangle fan?
            drawCount, //how many vertexes are we drawing?
            gl.UNSIGNED_SHORT, //what kind of data are we drawing
            0 //how far into the element array buffer are we going to start drawing?
        );
    }

    const drawEntities = function(playerX, playerY, playerFrame, playerBright, enemies = []) {
        //Start by setting up to draw the player since the player is always on screen

        let drawCount = 6;
        if(enemies != null) {
            drawCount += 6 * enemies.length;

            for(let i = 0; i < enemies.length; i++) {
                //need to update entity vertex data (this changes because the width and height of entity frames are different)
//                entityVertexData

                const enemyXPos = 2 * enemies[i].posX / (widthInTiles * TILE_SIZE) - 1;
//                const enemyYPos = -(2 * (enemies[i].posY + 20) / (heightInTiles * TILE_SIZE) - 1);
                const enemyYPos = -(2 * (enemies[i].posY) / (heightInTiles * TILE_SIZE) - 1);
                
                entityPosData[((i + 1) * 8) + 0] = enemyXPos;
                entityPosData[((i + 1) * 8) + 1] = enemyYPos;
                entityPosData[((i + 1) * 8) + 2] = enemyXPos;
                entityPosData[((i + 1) * 8) + 3] = enemyYPos;
                entityPosData[((i + 1) * 8) + 4] = enemyXPos;
                entityPosData[((i + 1) * 8) + 5] = enemyYPos;
                entityPosData[((i + 1) * 8) + 6] = enemyXPos;
                entityPosData[((i + 1) * 8) + 7] = enemyYPos;
            }
        }

        entityPosData[0] = playerX;
        entityPosData[1] = playerY;
        entityPosData[2] = playerX;
        entityPosData[3] = playerY;
        entityPosData[4] = playerX;
        entityPosData[5] = playerY;
        entityPosData[6] = playerX;
        entityPosData[7] = playerY;

        //don't need to update entity index data (it's all just quads, so the order doesn't change, just how many we're drawing)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, entityIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, entityIndexData, gl.STATIC_DRAW);

        setUpEntityAttribs(playerBright, playerFrame, enemies);

        gl.drawElements(
            gl.TRIANGLES, //what to draw triangle strip? triangle fan?
            drawCount, //how many vertexes are we drawing?
            gl.UNSIGNED_SHORT, //what kind of data are we drawing
            0 //how far into the element array buffer are we going to start drawing?
        );
    }

    this.prepareEntityData = function(entityData) {
        const entityCanvas = document.createElement('canvas');
        let maxWidth = 0;
        let totalHeight = 0;
        for(let key in entityData) {
            if(entityData[key].image.width > maxWidth) {
                maxWidth = entityData[key].image.width;
            }

            totalHeight += (entityData[key].image.height + 1);
        }

        entityCanvas.width = maxWidth;
        entityCanvas.height = totalHeight;
        const entityContext = entityCanvas.getContext("2d");

        let currentHeight = 0;
        for(let key in entityData) {
            entities[key].frameX = 0;//all starting at zero for now
            entities[key].frameY = currentHeight;
            entities[key].frameWidth = entityData[key].image.width / entityData[key].frameCount;
            entities[key].frameHeight = entityData[key].image.height;
            entities[key].vert_x1 = 0.0;
            entities[key].vert_x2 = entities[key].frameWidth * 2.0 / (widthInTiles * TILE_SIZE);
            entities[key].vert_y1 = (entityData[key].image.height * 2.0) / (heightInTiles * TILE_SIZE);
            entities[key].vert_y2 = 0.0;

            entityContext.drawImage(entityData[key].image, 0, currentHeight);
            currentHeight += entityData[key].image.height + 1;
        }

        entities.texture = texManager.setUpTexture(entityCanvas);
        entities.textureWidth = entityCanvas.width;
        entities.textureHeight = entityCanvas.height;

        //Player is always at the front of this array/buffer
        entityVertexData[0] = entities.player.vert_x1;
        entityVertexData[1] = entities.player.vert_y1;
        entityVertexData[2] = entities.player.vert_x2;
        entityVertexData[3] = entities.player.vert_y1;
        entityVertexData[4] = entities.player.vert_x1;
        entityVertexData[5] = entities.player.vert_y2;
        entityVertexData[6] = entities.player.vert_x2;
        entityVertexData[7] = entities.player.vert_y2;
    }

    this.getBackgroundImageCanvas = function(paused, tileData, flipIndices, deltaX, deltaY, playerX, playerY, playerFrame, playerBright = false, enemies = null) {
        if(paused) return webCanvas;
        if(BASELINE == null) BASELINE = G.view.y;
        //Prepare to draw this frame
        gl.clearColor(0.0, 0.0, 0.0, 1.0);//full black
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //Prepare to draw background and tile layers
        gl.useProgram(tileProgram);//Need the tileProgram for background and tile layers

        gl.disable(gl.BLEND);//no blending when drawing the background layer

        drawBackground(deltaX, deltaY);
        
        gl.enable(gl.BLEND);//enable blending so the tile layer appears on top of the background as desired
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
        drawTiles(tileData, deltaX, deltaY);

        //Prepare to draw flipspace
        gl.useProgram(flipProgram);
        drawFlipspace(flipIndices);

        //Prepare to draw entities (player and enemies)
        gl.useProgram(entityProgram);
        const playXPos = 2 * playerX / (widthInTiles * TILE_SIZE) - 1;
        const playYPos = -(2 * playerY / (heightInTiles * TILE_SIZE) - 1);
        drawEntities(playXPos, playYPos, playerFrame, playerBright, enemies);

        return webCanvas;
    }

    return this;
}

export default WebRenderer;
