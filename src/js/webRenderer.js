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

    const tileIndexBuffer = gl.createBuffer();
    const bkgdIndexBuffer = gl.createBuffer();

    //------Set up texture coordinate arrays so we can sample textures---------//
    const texCoordinator = new textureCoordinateBuilder();

    const tileTexCoords = new Float32Array(8 * widthInTiles * heightInTiles).fill(0);
    const tileTexCoordBuffer = gl.createBuffer();

    const bkgdTexCoords = new Float32Array(8 * widthInBKGDs * heightInBKGDs).fill(0);
    texCoordinator.generateBKDGCoords(bkgdTexCoords, widthInBKGDs * heightInBKGDs);
    const bkgdTexCoordBuffer = gl.createBuffer();

    const getVertexShaderString = function() {
        //right now vertPosition is a vec2, eventually might want a vec3 in order to build multi-layered image

        return `
        precision mediump float;

        attribute vec2 vertPosition;
        attribute vec2 aTextureCoord;
        uniform vec2 delta;

        varying vec2 vTextureCoord;

        void main() {
            gl_Position = vec4(vertPosition.x + delta.x, vertPosition.y + delta.y, 0.0, 1.0);
            vTextureCoord = aTextureCoord;
        }
        `;
    }

    const getFragmentShaderString = function() {
        return `
        precision mediump float;

        varying vec2 vTextureCoord;

        uniform sampler2D sampler;

        void main(void) {
            gl_FragColor = texture2D(sampler, vTextureCoord);
        }
        `;
    }

    const getWebGLProgram = function() {
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertexShader, getVertexShaderString());
        gl.shaderSource(fragmentShader, getFragmentShaderString());

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

    const program = getWebGLProgram();
    gl.useProgram(program);

    const setUpTileAttribs = function(tileData, deltaX, deltaY) {
        gl.bindBuffer(gl.ARRAY_BUFFER, tileVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, tileVertexData, gl.STATIC_DRAW);

        const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
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
        const depthUniformLocation = gl.getUniformLocation(program, 'delta');
        gl.uniform2fv(depthUniformLocation, tileDelta);

        // Tell the shader we bound the texture to texture unit 0
        const samplerUniformLocation = gl.getUniformLocation(program, 'sampler');
        gl.uniform1i(samplerUniformLocation, tileTexture);

        texCoordinator.generateTileCoords(sourceWidthInTiles, w, h, tileData, tileTexCoords);

        gl.bindBuffer(gl.ARRAY_BUFFER, tileTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, tileTexCoords, gl.STATIC_DRAW);

        const texCoordAttribLocation = gl.getAttribLocation(program, 'aTextureCoord');
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

    const setUpBkgdAttribs = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, bkgdVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, bkgdVertexData, gl.STATIC_DRAW);

        const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
        gl.vertexAttribPointer(
            positionAttribLocation, //Attribute location
            2, //number of elements per attribute
            gl.FLOAT, //Type of the elements
            gl.FALSE, //Is data normalized?
            0 * Float32Array.BYTES_PER_ELEMENT, //Stride
            0 //Offset into buffer for first element of this type
        );

        gl.enableVertexAttribArray(positionAttribLocation);
        
        const depthUniformLocation = gl.getUniformLocation(program, 'delta');
        gl.uniform2fv(depthUniformLocation, bkgdDelta);

        // Tell the shader we bound the texture to texture unit 1
        const bkgdSamplerUniformLocation = gl.getUniformLocation(program, 'sampler');
        gl.uniform1i(bkgdSamplerUniformLocation, bkgdTexture);

        gl.bindBuffer(gl.ARRAY_BUFFER, bkgdTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, bkgdTexCoords, gl.STATIC_DRAW);

        const texCoordAttribLocation = gl.getAttribLocation(program, 'aTextureCoord');
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

    this.getBackgroundImageCanvas = function(tileData, deltaX, deltaY) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);//full black
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.disable(gl.BLEND);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bkgdIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bkgdIndexData, gl.STATIC_DRAW);

        setUpBkgdAttribs(deltaX, deltaY);

        gl.drawElements(
            gl.TRIANGLES, //what to draw triangle strip? triangle fan?
            bkgdIndexData.length, //how many vertexes are we drawing?
            gl.UNSIGNED_SHORT, //what kind of data are we drawing
            0 //how far into the element array buffer are we going to start drawing?
        );
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tileIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tileIndexData, gl.STATIC_DRAW);

        setUpTileAttribs(tileData, deltaX, deltaY);
        
        gl.drawElements(
            gl.TRIANGLES, //what to draw triangle strip? triangle fan?
            vertexCount, //how many vertexes are we drawing?
            gl.UNSIGNED_SHORT, //what kind of data are we drawing
            0 //how far into the element array buffer are we going to start drawing?
        );

        return webCanvas;
    }

    return this;
}

export default WebRenderer;
