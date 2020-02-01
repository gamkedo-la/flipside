//Make some webGL stuff here
function WebRenderer(mainCanvas, tileImage) {
    const webCanvas = document.createElement('canvas');
    webCanvas.width = mainCanvas.width;
    webCanvas.height = mainCanvas.height;
    
    const gl = webCanvas.getContext('webgl');
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

    const TILE_SIZE = 8;
    let vertexCount = 0

    const generateVertData = function() {
        const startX = -webCanvas.width/2 - (2 * TILE_SIZE);
        const startY = -webCanvas.height/2 - (2 * TILE_SIZE);

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
        const vertsPerRow = 4 + webCanvas.width / TILE_SIZE;//4 give two tiles on each side of the visible screen
        const numRows = 4 + webCanvas.height / TILE_SIZE;//4 give two tiles above and two below the visible screen

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

        //need to populate the texture coordinates based on provided tileData

        return new Float32Array(coords);
    }

    const textCoordBuffer = gl.createBuffer();

    const getVertexShaderString = function() {
        //right now vertPosition is a vec2, eventually might want a vec3 in order to build multi-layered image

        return `
        precision mediump float;

        attribute vec2 vertPosition;

        varying highp vec2 vTextureCoord;

        void main() {
            gl_Position = vec4(vertPosition, 0.0, 1.0);
        }
        `;
    }

    const getFragmentShaderString = function() {
        return `
        precision mediump float;

        varying highp vec2 vTextureCoord;

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

        const num = 2; // every coordinate composed of 2 values
        const type = gl.FLOAT; // the data in the buffer is 32 bit float
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set to the next
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

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
