export const G = {
    DEBUG_MODE          :       false,
    //loading totals
    imagesLoaded        :           0,
    soundsLoaded        :           0,
    imagesTotal         :           0,
    soundsTotal         :           0,
    //particle types
    JETBUBBLE          :           1,
    CROSSBUBBLE        :           2,
    ENEMYDEATH         :           3,
    BULLET             :           4,
    FIRE               :           5,
    PICKUP_NANITE      :           6,
    PICKUP_HEALTH      :           7,
    PICKUP_DEATH       :           8,
    MUZZLESMOKE        :           9,
    FLIPSPACE_DEATH    :          10,
    POISONPARTICLE     :          11,
    BIGPOWERUP         :          12, 
    MESSAGE            :          13,
    MUZZLEFLASH        :          14,
    DUST               :          15,
    PLAYER_HURT        :          16,
    PLAYER_PICKED_UP   :          17,
    PLAYER_ITEM_HEALTH :          18,
    PLAYER_ITEM_NANITE :          19,
    PLAYER_BOOTS_PICKUP:          20,
    PLAYER_GUN_PICKUP  :          21,
    PLAYER_EVSUIT_PICKUP:         22,
    PLAYER_EVGUN_PICKUP:          23,
    EVSMOKE             :           24,

//particle buffer params
    PARTICLE_X         :           1,
    PARTICLE_Y         :           2,
    PARTICLE_VEL_X     :           3,
    PARTICLE_VEL_Y     :           4,
    PARTICLE_WIDTH     :           5,
    PARTICLE_HEIGHT    :           6,
    PARTICLE_COLOR     :           7,
    PARTICLE_TYPE      :           8,
    PARTICLE_PREV_X    :           9,
    PARTICLE_PREV_Y    :          10,

    GRAVITY            :          10,

    GID_FLIPSPACE      :            3,

    FLIPSPACE_TIME     :            180,

    TRANSITION_DEATH    :           1,

    PLAYER_STARTMAP     :       'room02',
    PLAYER_STARTSPAWN   :       'PlayerStart',


    //portrait enums
    PORTRAIT_SIZE       :           50,
    PORTRAIT_FLIPBAT    :           1,
    PORTRAIT_FLIPSLIME  :           2,
    PORTRAIT_FLIPPIG    :           3,
    PORTRAIT_FLIPSPIDER :           4,
    PORTRAIT_FLIPTANK   :           5,
    PORTRAIT_FLIPDRONE  :           6,
    PORTRAIT_FLIPBIRD   :           7,
    PORTRAIT_INFO       :           8,


    scenes: {},
    collideIndex: 1009,
    hazardTilesStartIndex: 113,
    hazardTilesEndIndex: 120,
    cloudTilesStartIndex: 977,
    cloudTilesEndIndex: 992,
    switchingMusic: false,

    healthBarLocation : {x: 4, y: 4},
    healthBarDimensions : {w: 50, h: 8},
    healthBarColor : '#E00',

    naniteBarLocation : {x: 4, y: 14},
    naniteBarDimensions : {w: 50, h: 8},
    naniteBarColor : '#0F0',    

    showMessageBox: false,
    messageCooldown: 0,
    deathCooldown: 0,
    deathCooldownMax: 180,

    showMiniMap: false,

    musicMap: {
        "room02": "testMusic1",
        "room03": "vanishing",
        "room04": "testMusic1",
        "room04a": "testMusic1",
        "room05": "testMusic1",
        "room06": "testMusic1",
        "room07": "testMusic1",
        "room08": "testMusic1",
        "room09": "testMusic1",
        "room10": "testMusic1",
        "room13": "vanishing",
        "room13a": "vanishing",
        "room14": "testMusic1",
        "bunker": "testMusic1",
        "theArmory": "testMusic1",
        "theLab": "testMusic1",
        "flipSpaceCavern": "testMusic1",
        "bunker": "testMusic1",

        
    }

};

export default G;