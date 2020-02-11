export const G = {

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


    scenes: {},

    healthBarLocation : {x: 4, y: 4},
    healthBarDimensions : {w: 50, h: 8},
    healthBarColor : '#E00',

    naniteBarLocation : {x: 4, y: 14},
    naniteBarDimensions : {w: 50, h: 8},
    naniteBarColor : '#0F0',    

    showMessageBox: false,
    messageCooldown: 0,

};

export default G;