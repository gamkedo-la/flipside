//IndexDataBuilder
const indexDataBuilder = function indexDataBuilder() {
    const vertsPerTile = 4; //tiles are quads
    this.generateIndices = function(numQuads) {
        const indexData = new Uint16Array(6 * numQuads).fill(0);
        for(let i = 0; i < numQuads; i++) {
            indexData[6 * i + 0] = (0 + i * vertsPerTile);
            indexData[6 * i + 1] = (3 + i * vertsPerTile);
            indexData[6 * i + 2] = (1 + i * vertsPerTile);
            indexData[6 * i + 3] = (0 + i * vertsPerTile);
            indexData[6 * i + 4] = (2 + i * vertsPerTile);
            indexData[6 * i + 5] = (3 + i * vertsPerTile);
        }

        return indexData;
    }

    return this;
}

export default indexDataBuilder;