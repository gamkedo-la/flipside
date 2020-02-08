//Make some webGL stuff here
const WebRenderer = function WebRenderer(widthInTiles, heightInTiles, tileImage) {
    const TILE_SIZE = 8;
    const webCanvas = document.createElement('canvas');
    webCanvas.width = widthInTiles * TILE_SIZE;
    webCanvas.height = heightInTiles * TILE_SIZE;
    const w = TILE_SIZE / tileImage.width;  //width of a tile in Texture Coordinate space
    const h = TILE_SIZE / tileImage.height; //height of a tile in Texture Coordinate space

    const sourceWidthInTiles = tileImage.width / TILE_SIZE;
    
    let gl = webCanvas.getContext('webgl');
    if(!gl) {
        gl = webCanvas.getContext('experimental-webgl');
    }

    if(!gl) {
        console.error("WebGL not supported");
    }

    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);

    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tileImage);
    //The tiles image is non-power of 2 dimensions, so WebGL1 can't do some things. Turn those things off
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    
    let vertexCount = 0;//not just vertsPerRow * numRows because we revisit some vertices and they need to be counted

    const generateVertData = function() { 
        const numTiles = widthInTiles * heightInTiles;
        for(let i = 0; i < numTiles; i++) {
            const x1 = -1 + (i % widthInTiles) * 2/widthInTiles;
            const x2 = x1 + 2/widthInTiles;
            const y1 = 1 - (Math.floor(i / widthInTiles)) * 2/heightInTiles;
            const y2 = y1 - 2/heightInTiles;

            vertexData[8 * i + 0] = x1;
            vertexData[8 * i + 1] = y1;

            vertexData[8 * i + 2] = x2;
            vertexData[8 * i + 3] = y1;

            vertexData[8 * i + 4] = x1;
            vertexData[8 * i + 5] = y2;

            vertexData[8 * i + 6] = x2;
            vertexData[8 * i + 7] = y2;
        }
    }
    const vertexData = new Float32Array(8 * widthInTiles * heightInTiles).fill(0);
    generateVertData();

    const vertexBufferObject = gl.createBuffer();

    const generateIndexData = function() {
        const numTiles = widthInTiles * heightInTiles;

        for(let i = 0; i < numTiles; i++) {
            const vertsPerTile = 4; //tiles are quads

            indexData[6 * i + 0] = (0 + i * vertsPerTile);
            indexData[6 * i + 1] = (3 + i * vertsPerTile);
            indexData[6 * i + 2] = (1 + i * vertsPerTile);
            indexData[6 * i + 3] = (0 + i * vertsPerTile);
            indexData[6 * i + 4] = (2 + i * vertsPerTile);
            indexData[6 * i + 5] = (3 + i * vertsPerTile);
        }
    }

    const indexData = new Uint16Array(6 * widthInTiles * heightInTiles).fill(0);
    generateIndexData();

    vertexCount = indexData.length;
    const indexBuffer = gl.createBuffer();

    const generateTexCoords = function(tileData) {
        for(let i = 0; i < tileData.length; i++) {
            const GID = tileData[i];

            const x1 = (((GID) % sourceWidthInTiles) * w);
            const x2 = (x1 + w);
            const y1 = (Math.floor(GID / sourceWidthInTiles) * h);
            const y2 = y1 + h ;

                //first vertex (upper left)
                texCoords[8 * i + 0] = x1;
                texCoords[8 * i + 1] = y1;
                //second vertex (lower left)
                texCoords[8 * i + 2] = x2;
                texCoords[8 * i + 3] = y1;
                //third vertex (lower right)
                texCoords[8 * i + 4] = x1;
                texCoords[8 * i + 5] = y2;
                //fourth vertex (upper right)
                texCoords[8 * i + 6] = x2;
                texCoords[8 * i + 7] = y2;
        }
    }

    const texCoords = new Float32Array(8 * widthInTiles * heightInTiles).fill(0);
    const textCoordBuffer = gl.createBuffer();

    const getVertexShaderString = function() {
        //right now vertPosition is a vec2, eventually might want a vec3 in order to build multi-layered image

        return `
        precision mediump float;

        attribute vec2 vertPosition;
        attribute vec2 aTextureCoord;

        varying vec2 vTextureCoord;

        void main() {
            gl_Position = vec4(vertPosition, 0.0, 1.0);
            vTextureCoord = aTextureCoord;
        }
        `;
    }

    const getFragmentShaderString = function() {
        return `
        precision highp float;

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

    const setUpAttribs = function(tileData) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

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

        // Tell the shader we bound the texture to texture unit 0
        const samplerUniformLocation = gl.getUniformLocation(program, 'sampler');
        gl.uniform1i(samplerUniformLocation, 0);

        generateTexCoords(tileData);

        gl.bindBuffer(gl.ARRAY_BUFFER, textCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

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

    this.getBackgroundImageCanvas = function(tileData) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);//full black
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

        setUpAttribs(tileData);
        
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
