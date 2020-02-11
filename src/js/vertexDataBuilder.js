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

    return this;
}

export default vertexDataBuilder;