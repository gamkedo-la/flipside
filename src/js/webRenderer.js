//Make some webGL stuff here
const WebRenderer = function WebRenderer(widthInTiles, heightInTiles, tileImage, bkgdImage) {
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

    // Tell WebGL we want to affect texture unit 1
    gl.activeTexture(gl.TEXTURE1);

    // Bind the texture to texture unit 1
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bkgdImage);

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

            tileVertexData[8 * i + 0] = x1;
            tileVertexData[8 * i + 1] = y1;

            tileVertexData[8 * i + 2] = x2;
            tileVertexData[8 * i + 3] = y1;

            tileVertexData[8 * i + 4] = x1;
            tileVertexData[8 * i + 5] = y2;

            tileVertexData[8 * i + 6] = x2;
            tileVertexData[8 * i + 7] = y2;
        }
    }
    const tileVertexData = new Float32Array(8 * widthInTiles * heightInTiles).fill(0);
    generateVertData();

    const generateBkgdVertData = function() {
        let startX = -((widthInBKGDs * bkgdImage.width) - webCanvas.width) / 2;
        startX = -1 + startX / webCanvas.width;

        let startY = ((heightInBKGDs * bkgdImage.height) - webCanvas.height) / 2;
        startY = 1 + startY / webCanvas.height;

        const numBKGDs = widthInBKGDs * heightInBKGDs;

        for(let i = 0; i < numBKGDs; i++) {
            const x1 = startX + (i % widthInBKGDs) * 2 / widthInBKGDs;
            const x2 = x1 + 2/widthInBKGDs;
            const y1 = startY - (Math.floor(i / widthInBKGDs)) * 2/heightInBKGDs;
            const y2 = y1 - 2/heightInBKGDs;

            bkgdVertexData[8 * i + 0] = x1;
            bkgdVertexData[8 * i + 1] = y1;

            bkgdVertexData[8 * i + 2] = x2;
            bkgdVertexData[8 * i + 3] = y1;

            bkgdVertexData[8 * i + 4] = x1;
            bkgdVertexData[8 * i + 5] = y2;

            bkgdVertexData[8 * i + 6] = x2;
            bkgdVertexData[8 * i + 7] = y2;
        }
    }
    const bkgdVertexData = new Float32Array(8 * widthInBKGDs * heightInBKGDs).fill(0);
    generateBkgdVertData();

    const tileVertexBuffer = gl.createBuffer();
    const bkgdVertexBuffer = gl.createBuffer();

    const generateIndexData = function() {
        const numTiles = widthInTiles * heightInTiles;

        for(let i = 0; i < numTiles; i++) {
            const vertsPerTile = 4; //tiles are quads

            tileIndexData[6 * i + 0] = (0 + i * vertsPerTile);
            tileIndexData[6 * i + 1] = (3 + i * vertsPerTile);
            tileIndexData[6 * i + 2] = (1 + i * vertsPerTile);
            tileIndexData[6 * i + 3] = (0 + i * vertsPerTile);
            tileIndexData[6 * i + 4] = (2 + i * vertsPerTile);
            tileIndexData[6 * i + 5] = (3 + i * vertsPerTile);
        }
    }

    const tileIndexData = new Uint16Array(6 * widthInTiles * heightInTiles).fill(0);
    generateIndexData();
    vertexCount = tileIndexData.length;

    const generateBkgdIndexData = function() {
        const numTiles = widthInBKGDs * heightInBKGDs;

        for(let i = 0; i < numTiles; i++) {
            const vertsPerBkgd = 4; //tiles are quads

            bkgdIndexData[6 * i + 0] = (0 + i * vertsPerBkgd);
            bkgdIndexData[6 * i + 1] = (3 + i * vertsPerBkgd);
            bkgdIndexData[6 * i + 2] = (1 + i * vertsPerBkgd);
            bkgdIndexData[6 * i + 3] = (0 + i * vertsPerBkgd);
            bkgdIndexData[6 * i + 4] = (2 + i * vertsPerBkgd);
            bkgdIndexData[6 * i + 5] = (3 + i * vertsPerBkgd);
        }
    }
    const bkgdIndexData = new Uint16Array(6 * widthInBKGDs * heightInBKGDs).fill(0);
    generateBkgdIndexData();

    const tileIndexBuffer = gl.createBuffer();
    const bkgdIndexBuffer = gl.createBuffer();

    const generateTexCoords = function(tileData) {
        for(let i = 0; i < tileData.length; i++) {
            let GID = tileData[i];

            if(GID < 0) {
                GID = 1;
            }

            const x1 = (((GID) % sourceWidthInTiles) * w);
            const x2 = (x1 + w);
            const y1 = (Math.floor(GID / sourceWidthInTiles) * h);
            const y2 = y1 + h ;

                //first vertex (upper left)
                tileTexCoords[8 * i + 0] = x1;
                tileTexCoords[8 * i + 1] = y1;
                //second vertex (lower left)
                tileTexCoords[8 * i + 2] = x2;
                tileTexCoords[8 * i + 3] = y1;
                //third vertex (lower right)
                tileTexCoords[8 * i + 4] = x1;
                tileTexCoords[8 * i + 5] = y2;
                //fourth vertex (upper right)
                tileTexCoords[8 * i + 6] = x2;
                tileTexCoords[8 * i + 7] = y2;
        }
    }

    const tileTexCoords = new Float32Array(8 * widthInTiles * heightInTiles).fill(0);
    const tileTexCoordBuffer = gl.createBuffer();

    const generateBkgdTexCoords = function() {
        const numBKGDs = widthInBKGDs * heightInBKGDs;
        for(let i = 0; i < numBKGDs; i++) {
            const x1 = 0;
            const x2 = 1;
            const y1 = 0;
            const y2 = 1;

                //first vertex (upper left)
                bkgdTexCoords[8 * i + 0] = x1;
                bkgdTexCoords[8 * i + 1] = y1;
                //second vertex (lower left)
                bkgdTexCoords[8 * i + 2] = x2;
                bkgdTexCoords[8 * i + 3] = y1;
                //third vertex (lower right)
                bkgdTexCoords[8 * i + 4] = x1;
                bkgdTexCoords[8 * i + 5] = y2;
                //fourth vertex (upper right)
                bkgdTexCoords[8 * i + 6] = x2;
                bkgdTexCoords[8 * i + 7] = y2;
        }
    }
    const bkgdTexCoords = new Float32Array(8 * widthInBKGDs * heightInBKGDs).fill(0);
    generateBkgdTexCoords();
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
        gl.uniform1i(samplerUniformLocation, 0);

        generateTexCoords(tileData);

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
        gl.uniform1i(bkgdSamplerUniformLocation, 1);

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
