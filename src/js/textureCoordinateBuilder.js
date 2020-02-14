//textureCoordinateBuilder
const textureCoordinateBuilder = function textureCoordinateBuilder() {
    this.generateBKDGCoords = function(coordArray, numQuads) {
        for(let i = 0; i < numQuads; i++) {
            const x1 = 0;
            const x2 = 1;
            const y1 = 0;
            const y2 = 1;

            //first vertex (upper left)
            coordArray[8 * i + 0] = x1;
            coordArray[8 * i + 1] = y1;
            //second vertex (lower left)
            coordArray[8 * i + 2] = x2;
            coordArray[8 * i + 3] = y1;
            //third vertex (lower right)
            coordArray[8 * i + 4] = x1;
            coordArray[8 * i + 5] = y2;
            //fourth vertex (upper right)
            coordArray[8 * i + 6] = x2;
            coordArray[8 * i + 7] = y2;
        }
    };

    this.generateTileCoords = function(sourceWidthInTiles, w, h, GIDs, tileTexCoords) {
        for(let i = 0; i < GIDs.length; i++) {
            let GID = GIDs[i];

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
    };
    
    return this;
}

export default textureCoordinateBuilder;