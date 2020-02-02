//Make some webGL stuff here
function WebRenderer(mainCanvas, tileImage) {
    const TILE_SIZE = 8;
    const TILE_PAD = 3
    const webCanvas = document.createElement('canvas');
    webCanvas.width = mainCanvas.width + (2 * TILE_PAD) * TILE_SIZE;
    webCanvas.height = mainCanvas.height + (2 * TILE_PAD) * TILE_SIZE;
    const w = TILE_SIZE / tileImage.width;  //width of a tile in Texture Coordinate space
    const h = TILE_SIZE / tileImage.height; //height of a tile in Texture Coordinate space
    const TILES_PER_ROW = tileImage.width / TILE_SIZE;
    
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
    gl.bindTexture(gl.TEXTURE_2D, tileImage);

    
    let vertexCount = 0

    const generateVertData = function() {
        const startX = -webCanvas.width / 2;
        const startY = -webCanvas.height / 2;

        const vertArray = [];
        for(let y = startY; y < -startY; y += TILE_SIZE) {
            for(let x = startX; x < -startX; x += TILE_SIZE) {
                vertArray.push(x);
                vertArray.push(y);
                vertexCount++;
            }
        }

        return new Float32Array(vertArray);
    }

    const vertexData = generateVertData();
    const vertexBufferObject = gl.createBuffer();

    const generateIndexData = function() {
        const vertsPerRow = webCanvas.width / TILE_SIZE;
        const numRows = webCanvas.height / TILE_SIZE;

        const indexArray = [];
        for(let row = 0; row < numRows - 1; row++) {
            let rowStart = row * vertsPerRow;
            let nextRowStart = rowStart + vertsPerRow;
            for(let col = 0; col < vertsPerRow - 1; col++) {
                let a = rowStart + col;
                let b = nextRowStart + col;
                indexArray.push(a);
                indexArray.push(b);
                indexArray.push(b + 1);
                indexArray.push(a);
                indexArray.push(b + 1);
                indexArray.push(a + 1);
            }
        }
        return new Uint16Array(indexArray);
    }

    const indexData = generateIndexData();
    const indexBuffer = gl.createBuffer();

    const generateTexCoords = function(tileData) {
        const coords = [];

        /* need to populate the texture coordinates based on provided tileData
           tileData is GID info from Tiled for each tile position starting two
           tiles left of the left edge of the screen and two tiles above the top
           and extending to two tiles to the right and two below the screen */

        /* tile width in texCoord space  is w = TILE_SIZE / tileImage.width
           tile height in texCoord space is h = TILE_SIZE / tileImage.height
           tilesPerRow is TILE_SIZE / tileImage.width
           totalRows is TILE_SIZE / tileImage.height */

        /* GID = 1 starts at texCoord (0, 0) and extends to (w, h)
           GID = 2 starts at texCoord (w, 0) and extends to (2 * w, h)
           GID = 16 starts at texCoord (15 * w, 0) and extends to (1, h)
           GID = 17 starts at texCoord (0, h) and extends to (w, 2 * h) */

        /* For any GID, its left edge is at texCoord.x = (GID - 1) % 16) * w
           For any GID, its right edge is at texCoord.x = (1 + (GID - 1) % 16) * w
           For any GID, its top is at texCoord.y = (Math.floor(GID / 16)) * h
           For any GID, its bottom is at texCoord.y = (1 + Math.floor(GID / 16)) * h 
           */

        /* Vertex Data draws the lower left half of the upper left tile, then the
           upper right have of that tile, then it does the same for the tile to the
           right and moves accross the row, moving down after reaching the right hand
           side of the row. */

        for(let i = 0; i < tileData.length; i++) {
            const GID = tileData[i];
        
            
            const x1 = ((GID - 1) % TILES_PER_ROW) * w;
            const x2 = x1 + w;
            const y1 = (Math.floor(GID / TILES_PER_ROW)) * h;
            const y2 = y1 + h
            //first triangle
            //first vertex (upper left)
            coords.push(x1);
            coords.push(y1);
            //second vertex (lower left)
            coords.push(x1);
            coords.push(y2);
            //third vertex (lower right)
            coords.push(x2);
            coords.push(y2);
            //second triangle
            //fourth vertex (upper left)
            coords.push(x1);
            coords.push(y1);
            //fifth vertex (lower right)
            coords.push(x2);
            coords.push(y2);
            //sixth vertex (upper right)
            coords.push(x2);
            coords.push(y1);
        }

        return new Float32Array(coords);
    }

    //texCoordData must by dynamically generated each frame, that's why it isn't here
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

    const setUpAttribs = function() {
        const positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
        gl.vertexAttribPointer(
            positionAttribLocation, //Attribute location
            2, //number of elements per attribute
            gl.FLOAT, //Type of the elements
            gl.FALSE, //Is data normalized?
            2 * Float32Array.BYTES_PER_ELEMENT, //Stride
            0 //Offset into buffer for first element of this type
        );

        gl.enableVertexAttribArray(positionAttribLocation);

        // Tell the shader we bound the texture to texture unit 0
        const samplerUniformLocation = gl.getUniformLocation(program, 'sampler');
        gl.uniform1i(samplerUniformLocation, 0);

        const texCoordAttribLocation = gl.getAttribLocation(program, 'aTextureCoord');
        gl.vertexAttribPointer(
            texCoordAttribLocation, //Attribute location
            2, //number of elements per attribute
            gl.FLOAT, //Type of the elements
            gl.FALSE, //Is data normalized?
            2 * Float32Array.BYTES_PER_ELEMENT, //Stride
            0 //Offset into buffer for first element of this type
        );

        gl.enableVertexAttribArray(texCoordAttribLocation);
    }

    this.getBackgroundImageCanvas = function(tileData) {
//        gl.viewport(0, 0, webCanvas.width, webCanvas.height);//defaults to canvas size so shouldn't need to set it

        gl.clearColor(0, 0, 0, 1.0);//full black
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

        const texCoords = generateTexCoords(tileData);
        gl.bindBuffer(gl.ARRAY_BUFFER, textCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

//        gl.useProgram(program); //don't need to set this every frame, so going to try to set it and leave it

        setUpAttribs();
        
        gl.drawElements(
            gl.TRIANGLES, //what to draw triangle strip? triangle fan?
            vertexCount, //how many vertexes are we drawing?
            gl.UNSIGNED_SHORT, //what kind of data are we drawing
            0 //how far into the element array buffer are we going to start drawing?
        );

        return webCanvas;
    }
}

export default WebRenderer;
