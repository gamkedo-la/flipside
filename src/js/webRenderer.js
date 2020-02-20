import GLTextureManager from './GLTextureManager.js';
import vertexDataBuilder from './vertexDataBuilder.js';
import indexDataBuilder from './indexDataBuilder.js';
import textureCoordinateBuilder from './textureCoordinateBuilder.js';

//Make some webGL stuff here
const WebRenderer = function WebRenderer(widthInTiles, heightInTiles, tileImage, bkgdImage) {
    //------Set up some basic constants---------//
    const TILE_SIZE = 8;
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
    let frameBuffTexIndex = null;
    const frameBuffTex = gl.createTexture();
    
    //------Set up the geometry, one quad per tile---------//
    let vertexCount = 0;//not just vertsPerRow * numRows because we revisit some vertices and they need to be counted
    const vertexGenerator = new vertexDataBuilder();
    const tileVertexData = vertexGenerator.generateQuads(widthInTiles, heightInTiles, -1, 1);

    let startX = -((widthInBKGDs * bkgdImage.width) - webCanvas.width) / 2;
    startX = -1 + startX / webCanvas.width;
    let startY = ((heightInBKGDs * bkgdImage.height) - webCanvas.height) / 2;
    startY = 1 + startY / webCanvas.height;
    const bkgdVertexData = vertexGenerator.generateQuads(widthInBKGDs, heightInBKGDs, startX, startY);

    const tileVertexBuffer = gl.createBuffer();
    const bkgdVertexBuffer = gl.createBuffer();

    //------Set up index arrays so we draw elements---------//
    const indexBuilder = new indexDataBuilder();
    const tileIndexData = indexBuilder.generateIndices(widthInTiles * heightInTiles);
    vertexCount = tileIndexData.length;
    const bkgdIndexData = indexBuilder.generateIndices(widthInBKGDs * heightInBKGDs);
    const flipColorData = new Float32Array(3 * tileVertexData.length).fill(0.0);//not index data, holds color data for each vertex
    const flipIndexData = new Uint16Array(tileIndexData.length).fill(0);

    const tileIndexBuffer = gl.createBuffer();
    const bkgdIndexBuffer = gl.createBuffer();
    const flipColorBuffer = gl.createBuffer();//not a buffer for index data
    const flipIndexBuffer = gl.createBuffer();

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

        attribute vec2 vertPosition;
        attribute vec3 flipColor;
        attribute vec2 fbCoords;

        varying vec3 overlayColor;
        varying vec2 frameBuffCoords;

        void main() {
            gl_Position = vec4(vertPosition.x + delta.x, vertPosition.y + delta.y, 0.0, 1.0);

            frameBuffCoords = vec2(fbCoords.x + delta.x / 2.0, fbCoords.y + delta.y / 2.0);
            overlayColor = flipColor;
        }
        `;
    }

    const getFlipFragShaderString = function() {
        //this is the fragment shader used for the background and tile layers

        return `
        precision mediump float;

        uniform sampler2D frameBuffSampler;

        varying vec3 overlayColor;
        varying vec2 frameBuffCoords;

        void main(void) {
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
            
            gl_FragColor.a = 1.0;// = vec4(2.0 * baseColor.rgb * overlayColor, 1.0);
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

    const tileProgram = getWebGLProgram(getVertexShaderString(), getFragmentShaderString());
    const flipProgram = getWebGLProgram(getFlipVertShaderString(), getFlipFragShaderString());

    //------Set up WebGL to use the uniforms and attributes necessary to draw the background tiles--------//
    const setUpBkgdAttribs = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, bkgdVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, bkgdVertexData, gl.STATIC_DRAW);

        const positionAttribLocation = gl.getAttribLocation(tileProgram, 'vertPosition');
        gl.vertexAttribPointer(
            positionAttribLocation, //Attribute location
            2, //number of elements per attribute
            gl.FLOAT, //Type of the elements
            gl.FALSE, //Is data normalized?
            0 * Float32Array.BYTES_PER_ELEMENT, //Stride
            0 //Offset into buffer for first element of this type
        );

        gl.enableVertexAttribArray(positionAttribLocation);
        
        const depthUniformLocation = gl.getUniformLocation(tileProgram, 'delta');
        gl.uniform2fv(depthUniformLocation, bkgdDelta);

        // Tell the shader we bound the texture to texture unit 1
        const bkgdSamplerUniformLocation = gl.getUniformLocation(tileProgram, 'sampler');
        gl.uniform1i(bkgdSamplerUniformLocation, bkgdTexture);

        gl.bindBuffer(gl.ARRAY_BUFFER, bkgdTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, bkgdTexCoords, gl.STATIC_DRAW);

        const texCoordAttribLocation = gl.getAttribLocation(tileProgram, 'aTextureCoord');
        gl.vertexAttribPointer(
            texCoordAttribLocation, //Attribute location
            2, //number of elements per attribute
            gl.FLOAT, //Type of the elements
            gl.FALSE, //Is data normalized?
            0 * Float32Array.BYTES_PER_ELEMENT, //Stride
            0 //Offset into buffer for first element of this type
        );

        gl.enableVertexAttribArray(texCoordAttribLocation);
    }

    //------Set up WebGL to use the uniforms and attributes necessary to draw the main tiles--------//
    const setUpTileAttribs = function(tileData, deltaX, deltaY) {
        gl.bindBuffer(gl.ARRAY_BUFFER, tileVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, tileVertexData, gl.STATIC_DRAW);

        const positionAttribLocation = gl.getAttribLocation(tileProgram, 'vertPosition');
        gl.vertexAttribPointer(
            positionAttribLocation, //Attribute location
            2, //number of elements per attribute
            gl.FLOAT, //Type of the elements
            gl.FALSE, //Is data normalized?
            0 * Float32Array.BYTES_PER_ELEMENT, //Stride
            0 //Offset into buffer for first element of this type
        );

        gl.enableVertexAttribArray(positionAttribLocation);

        tileDelta[0] = -(Math.round(deltaX)) / (4 * widthInTiles);
        tileDelta[1] = Math.round(deltaY) / (4 * heightInTiles);
        const deltaUniformLocation = gl.getUniformLocation(tileProgram, 'delta');
        gl.uniform2fv(deltaUniformLocation, tileDelta);

        // Tell the shader we bound the texture to texture unit 0
        const samplerUniformLocation = gl.getUniformLocation(tileProgram, 'sampler');
        gl.uniform1i(samplerUniformLocation, tileTexture);

        texCoordinator.generateTileCoords(sourceWidthInTiles, w, h, tileData, tileTexCoords);

        gl.bindBuffer(gl.ARRAY_BUFFER, tileTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, tileTexCoords, gl.STATIC_DRAW);

        const texCoordAttribLocation = gl.getAttribLocation(tileProgram, 'aTextureCoord');
        gl.vertexAttribPointer(
            texCoordAttribLocation, //Attribute location
            2, //number of elements per attribute
            gl.FLOAT, //Type of the elements
            gl.FALSE, //Is data normalized?
            0 * Float32Array.BYTES_PER_ELEMENT, //Stride
            0 //Offset into buffer for first element of this type
        );

        gl.enableVertexAttribArray(texCoordAttribLocation);
    }
    //------Set up WebGL to use the uniforms and attributes necessary to draw flipspace--------//
    const setUpFlipAttribs = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, tileVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, tileVertexData, gl.STATIC_DRAW);

        const positionAttribLocation = gl.getAttribLocation(flipProgram, 'vertPosition');
        gl.vertexAttribPointer(
            positionAttribLocation, //Attribute location
            2, //number of elements per attribute
            gl.FLOAT, //Type of the elements
            gl.FALSE, //Is data normalized?
            0 * Float32Array.BYTES_PER_ELEMENT, //Stride
            0 //Offset into buffer for first element of this type
        );

        gl.enableVertexAttribArray(positionAttribLocation);

        const deltaUniformLocation = gl.getUniformLocation(flipProgram, 'delta');
        gl.uniform2fv(deltaUniformLocation, tileDelta);

        // Tell the shader we bound the texture to texture unit 0
        const samplerUniformLocation = gl.getUniformLocation(flipProgram, 'frameBuffSampler');
        gl.uniform1i(samplerUniformLocation, frameBuffTexIndex);

        gl.bindBuffer(gl.ARRAY_BUFFER, fbTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, fbTexCoords, gl.STATIC_DRAW);

        const fbCoordAttribLocation = gl.getAttribLocation(flipProgram, 'fbCoords');
        gl.vertexAttribPointer(
            fbCoordAttribLocation, //Attribute location
            2, //number of elements per attribute
            gl.FLOAT, //Type of the elements
            gl.FALSE, //Is data normalized?
            0 * Float32Array.BYTES_PER_ELEMENT, //Stride
            0 //Offset into buffer for first element of this type
        );

        gl.enableVertexAttribArray(fbCoordAttribLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, flipColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flipColorData, gl.STATIC_DRAW);

        const flipColorAttribLocation = gl.getAttribLocation(flipProgram, 'flipColor');
        gl.vertexAttribPointer(
            flipColorAttribLocation, //Attribute location
            3, //number of elements per attribute
            gl.FLOAT, //Type of the elements
            gl.FALSE, //Is data normalized?
            0 * Float32Array.BYTES_PER_ELEMENT, //Stride
            0 //Offset into buffer for first element of this type
        );

        gl.enableVertexAttribArray(flipColorAttribLocation);
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

    this.getBackgroundImageCanvas = function(tileData, flipIndices, deltaX, deltaY) {
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

        return webCanvas;
    }

    return this;
}

export default WebRenderer;
