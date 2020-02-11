//GLTextureManager
const GLTextureManager = function GLTextureManager(gl) {
    const TEX_LIST = [
        gl.TEXTURE0,
        gl.TEXTURE1,
        gl.TEXTURE2,
        gl.TEXTURE3,     
        gl.TEXTURE4,
        gl.TEXTURE5,
        gl.TEXTURE6,
        gl.TEXTURE7,
    ]

    let texIndex = 0;

    this.setUpTexture = function(image) {
        // Tell WebGL we want to affect texture unit 0
        const currentTexure = TEX_LIST[texIndex];
        texIndex++;

        gl.activeTexture(currentTexure);

        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);


        //The tiles image is non-power of 2 dimensions, so WebGL1 can't do some things. Turn those things off
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        return (texIndex - 1);
    }

    return this;

}

export default GLTextureManager