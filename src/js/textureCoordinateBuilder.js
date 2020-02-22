import { rndInt } from "./math.js";

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
            //second vertex (upper right)
            coordArray[8 * i + 2] = x2;
            coordArray[8 * i + 3] = y1;
            //third vertex (lower left)
            coordArray[8 * i + 4] = x1;
            coordArray[8 * i + 5] = y2;
            //fourth vertex (lower right)
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

    this.generateFlipCoords = function(sourceWidthInTiles = 60, sourceHightInTiles = 36, fbTexCoords) {
        const numQuads = sourceWidthInTiles * sourceHightInTiles;
        for(let i = 0; i < numQuads; i++) {
            const x1 = (i % sourceWidthInTiles) * (1/sourceWidthInTiles);
            const x2 = x1 + 1/sourceWidthInTiles;
            const y1 = 1 - Math.floor(i / sourceWidthInTiles) * (1/sourceHightInTiles);
            const y2 = y1 - (1/sourceHightInTiles);

            //first vertex (upper left)
            fbTexCoords[8 * i + 0] = x1;
            fbTexCoords[8 * i + 1] = y1;
            //second vertex (upper right)
            fbTexCoords[8 * i + 2] = x2;
            fbTexCoords[8 * i + 3] = y1;
            //third vertex (lower left)
            fbTexCoords[8 * i + 4] = x1;
            fbTexCoords[8 * i + 5] = y2;
            //fourth vertex (lower right)
            fbTexCoords[8 * i + 6] = x2;
            fbTexCoords[8 * i + 7] = y2;
        }
    }

    const w = 1/16;//there are 16 tiles of 'flip edges' in each row of the flip image
    const h = 1/4;//there are 4 rows of flip edges in each column of the flip image 
    const topOfSEdge = 0/4;//
    const topOfNEdge = 1/4;
    const topOfWEdge = 2/4;
    const topOfEEdge = 3/4;
    this.generateFlipEdgeCoords = function(widthInTiles, flipTiles, leftTexCoords, topTexCoords, rightTexCoords, bottomTexCoords) {
        const flipSet = new Set(flipTiles);
        for(let i = 0; i < flipTiles.length; i++) {//flipColorArray[quads[i] * 12 + 3 * j + 0] = color1[0];
            const tile = flipTiles[i];
            const northIndex = flipSet.has(tile - widthInTiles);
            const southIndex = flipSet.has(tile + widthInTiles);
            const westIndex = flipSet.has(tile - 1);
            const eastIndex = flipSet.has(tile + 1);

            if(!northIndex) {//no flipspace to the north
                const whichTile = rndInt(0, 15);
                //first vertex (upper left)
                topTexCoords[tile * 8 + 0] = w * whichTile;
                topTexCoords[tile * 8 + 1] = topOfNEdge;
                //second vertex (upper right)
                topTexCoords[tile * 8 + 2] = w * (whichTile+ 1);
                topTexCoords[tile * 8 + 3] = topOfNEdge;
                //third vertex (lower left)
                topTexCoords[tile * 8 + 4] = w * whichTile;
                topTexCoords[tile * 8 + 5] = topOfNEdge + h;
                //fourth vertex (lower right)
                topTexCoords[tile * 8 + 6] = w * (whichTile + 1);
                topTexCoords[tile * 8 + 7] = topOfNEdge + h;
            } else {
                //Don't render any edges here becuase there's a flipspace tile above

                //first vertex (upper left)
                topTexCoords[tile * 8 + 0] = 0.0;
                topTexCoords[tile * 8 + 1] = 0.0;
                //second vertex (upper right)
                topTexCoords[tile * 8 + 2] = 0.0;
                topTexCoords[tile * 8 + 3] = 0.0;
                //third vertex (lower left)
                topTexCoords[tile * 8 + 4] = 0.0;
                topTexCoords[tile * 8 + 5] = 0.0;
                //fourth vertex (lower right)
                topTexCoords[tile * 8 + 6] = 0.0;
                topTexCoords[tile * 8 + 7] = 0.0;
            }

            if(!southIndex) {//no flipspace to the north
                const whichTile = rndInt(0, 15);
                //first vertex (upper left)
                bottomTexCoords[tile * 8 + 0] = w * whichTile;
                bottomTexCoords[tile * 8 + 1] = topOfSEdge;
                //second vertex (upper right)
                bottomTexCoords[tile * 8 + 2] = w * (whichTile+ 1);
                bottomTexCoords[tile * 8 + 3] = topOfSEdge;
                //third vertex (lower left)
                bottomTexCoords[tile * 8 + 4] = w * whichTile;
                bottomTexCoords[tile * 8 + 5] = topOfSEdge + h;
                //fourth vertex (lower right)
                bottomTexCoords[tile * 8 + 6] = w * (whichTile + 1);
                bottomTexCoords[tile * 8 + 7] = topOfSEdge + h;
            } else {
                //Don't render any edges here becuase there's a flipspace tile below

                //first vertex (upper left)
                bottomTexCoords[tile * 8 + 0] = 0.0;
                bottomTexCoords[tile * 8 + 1] = 0.0;
                //second vertex (upper right)
                bottomTexCoords[tile * 8 + 2] = 0.0;
                bottomTexCoords[tile * 8 + 3] = 0.0;
                //third vertex (lower left)
                bottomTexCoords[tile * 8 + 4] = 0.0;
                bottomTexCoords[tile * 8 + 5] = 0.0;
                //fourth vertex (lower right)
                bottomTexCoords[tile * 8 + 6] = 0.0;
                bottomTexCoords[tile * 8 + 7] = 0.0;
            }

            if(!westIndex) {//no flipspace to the north
                const whichTile = rndInt(0, 15);
                //first vertex (upper left)
                leftTexCoords[tile * 8 + 0] = w * whichTile;
                leftTexCoords[tile * 8 + 1] = topOfWEdge;
                //second vertex (upper right)
                leftTexCoords[tile * 8 + 2] = w * (whichTile+ 1);
                leftTexCoords[tile * 8 + 3] = topOfWEdge;
                //third vertex (lower left)
                leftTexCoords[tile * 8 + 4] = w * whichTile;
                leftTexCoords[tile * 8 + 5] = topOfWEdge + h;
                //fourth vertex (lower right)
                leftTexCoords[tile * 8 + 6] = w * (whichTile + 1);
                leftTexCoords[tile * 8 + 7] = topOfWEdge + h;
            } else {
                //Don't render any edges here becuase there's a flipspace tile to the left
                
                //first vertex (upper left)
                leftTexCoords[tile * 8 + 0] = 0.0;
                leftTexCoords[tile * 8 + 1] = 0.0;
                //second vertex (upper right)
                leftTexCoords[tile * 8 + 2] = 0.0;
                leftTexCoords[tile * 8 + 3] = 0.0;
                //third vertex (lower left)
                leftTexCoords[tile * 8 + 4] = 0.0;
                leftTexCoords[tile * 8 + 5] = 0.0;
                //fourth vertex (lower right)
                leftTexCoords[tile * 8 + 6] = 0.0;
                leftTexCoords[tile * 8 + 7] = 0.0;
            }

            if(!eastIndex) {//no flipspace to the north
                const whichTile = rndInt(0, 15);
                //first vertex (upper left)
                rightTexCoords[tile * 8 + 0] = w * whichTile;
                rightTexCoords[tile * 8 + 1] = topOfEEdge;
                //second vertex (upper right)
                rightTexCoords[tile * 8 + 2] = w * (whichTile+ 1);
                rightTexCoords[tile * 8 + 3] = topOfEEdge;
                //third vertex (lower left)
                rightTexCoords[tile * 8 + 4] = w * whichTile;
                rightTexCoords[tile * 8 + 5] = topOfEEdge + h;
                //fourth vertex (lower right)
                rightTexCoords[tile * 8 + 6] = w * (whichTile + 1);
                rightTexCoords[tile * 8 + 7] = topOfEEdge + h;
            } else {
                //Don't render any edges here becuase there's a flipspace tile to the right

                //first vertex (upper left)
                rightTexCoords[tile * 8 + 0] = 0.0;
                rightTexCoords[tile * 8 + 1] = 0.0;
                //second vertex (upper right)
                rightTexCoords[tile * 8 + 2] = 0.0;
                rightTexCoords[tile * 8 + 3] = 0.0;
                //third vertex (lower left)
                rightTexCoords[tile * 8 + 4] = 0.0;
                rightTexCoords[tile * 8 + 5] = 0.0;
                //fourth vertex (lower right)
                rightTexCoords[tile * 8 + 6] = 0.0;
                rightTexCoords[tile * 8 + 7] = 0.0;
            }
        }
    }
    
    return this;
}

export default textureCoordinateBuilder;