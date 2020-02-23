//vertexDataBuilder
const vertexDataBuilder = function vertexDataBuilder() {
    this.generateQuads = function(widthInQuads, heightInQuads, startX, startY) {
        const numQuads = widthInQuads * heightInQuads;
        const vertArray = new Float32Array(8 * widthInQuads * heightInQuads).fill(0);

        for(let i = 0; i < numQuads; i++) {
            const x1 = startX + (i % widthInQuads) * 2 / widthInQuads;
            const x2 = x1 + 2/widthInQuads;
            const y1 = startY - (Math.floor(i / widthInQuads)) * 2/heightInQuads;
            const y2 = y1 - 2/heightInQuads;

            vertArray[8 * i + 0] = x1;
            vertArray[8 * i + 1] = y1;

            vertArray[8 * i + 2] = x2;
            vertArray[8 * i + 3] = y1;

            vertArray[8 * i + 4] = x1;
            vertArray[8 * i + 5] = y2;

            vertArray[8 * i + 6] = x2;
            vertArray[8 * i + 7] = y2;
        }

        return vertArray;
    }

    const color1 = [232.0/255.0, 106.0/255.0, 115.0/255.0];
    const color2 = [188.0/255.0, 74.0/255.0, 155.0/255.0];
    this.generateFlipColors = function(quads, flipColorArray, indexArray) {
        for(let i = 0; i < quads.length; i++) {
            //0, 3, 1, 0, 2, 3
            indexArray[6 * i + 0] = 4 * quads[i] + 0;
            indexArray[6 * i + 1] = 4 * quads[i] + 3;
            indexArray[6 * i + 2] = 4 * quads[i] + 1;
            indexArray[6 * i + 3] = 4 * quads[i] + 0;
            indexArray[6 * i + 4] = 4 * quads[i] + 2;
            indexArray[6 * i + 5] = 4 * quads[i] + 3;

            for(let j = 0; j < 4; j++) {
                if(Math.random() > 0.5) {
                    flipColorArray[quads[i] * 12 + 3 * j + 0] = color1[0];
                    flipColorArray[quads[i] * 12 + 3 * j + 1] = color1[1];
                    flipColorArray[quads[i] * 12 + 3 * j + 2] = color1[2];
                }  else {
                    flipColorArray[quads[i] * 12 + 3 * j + 0] = color2[0];
                    flipColorArray[quads[i] * 12 + 3 * j + 1] = color2[1];
                    flipColorArray[quads[i] * 12 + 3 * j + 2] = color2[2];
                }
            }
        }

        return (6 * quads.length);
    }

    return this;
}

export default vertexDataBuilder;

        //232.0/255.0, 106.0/255.0, 115.0/255.0, 1.0; 
        //188.0/255.0, 74.0/255.0, 155.0/255.0, 1.0
/*        for(let i = 0; i < indices.length / 2; i++) {
            if(Math.random() > 0.5) {
                flipColorArray[3 * indices[i] + 0] = color1[0];
                flipColorArray[3 * indices[i] + 1] = color1[1];
                flipColorArray[3 * indices[i] + 2] = color1[2];
            }  else {
                flipColorArray[3 * indices[i] + 0] = color2[0];
                flipColorArray[3 * indices[i] + 1] = color2[1];
                flipColorArray[3 * indices[i] + 2] = color2[2];
            }
        }*/