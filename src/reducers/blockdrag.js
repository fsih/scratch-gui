const BLOCK_DRAG_UPDATE = 'scratch-gui/blockdrag/BLOCK_DRAG_UPDATE';
const BLOCK_DRAG_END = 'scratch-gui/blockdrag/BLOCK_DRAG_END';

const initialState = {
    areBlocksOverGui: false,
    blockSvg: null,
    spriteId: null
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case BLOCK_DRAG_UPDATE:
        return {
            areBlocksOverGui: action.areBlocksOverGui,
            blockSvg: null,
            spriteId: null
        };
    case BLOCK_DRAG_END:
        return {
            areBlocksOverGui: false,
            blockSvg: action.blockSvg,
            spriteId: action.spriteId
        };
    default:
        return state;
    }
};

const updateBlockDrag = function (areBlocksOverGui) {
    return {
        type: BLOCK_DRAG_UPDATE,
        areBlocksOverGui: areBlocksOverGui,
        meta: {
            throttle: 30
        }
    };
};

const updateEndDrag = function (spriteId, blockSvg) {
    return {
        type: BLOCK_DRAG_END,
        spriteId: spriteId,
        blockSvg: blockSvg
    };
};

export {
    reducer as default,
    updateBlockDrag,
    updateEndDrag
};
