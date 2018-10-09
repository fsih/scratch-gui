import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {setHoveredSprite} from '../reducers/hovered-target';
import {updateAssetDrag} from '../reducers/asset-drag';
import {getEventXY} from '../lib/touch-utils';
import VM from 'scratch-vm';
import {SVGRenderer} from 'scratch-svg-renderer';
import log from '../lib/log';

import SpriteSelectorItemComponent from '../components/sprite-selector-item/sprite-selector-item.jsx';

const dragThreshold = 3; // Same as the block drag threshold
// Contains 'font-family', but doesn't only contain 'font-family="none"'
const HAS_FONT_REGEXP = 'font-family(?!="none")';

class SpriteSelectorItem extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'getUpdatedCostumeURL',
            'handleClick',
            'handleDelete',
            'handleDuplicate',
            'handleExport',
            'handleMouseEnter',
            'handleMouseLeave',
            'handleMouseDown',
            'handleMouseMove',
            'handleMouseUp'
        ]);
        this.svgRenderer = new SVGRenderer();
        if (props.costumeURL) {
            this.state = {
                costumeURL: props.costumeURL,
                timestamp: Date.now()
            };
        } else {
            this.state = {
                costumeURL: null,
                timestamp: -1
            };
            this.getUpdatedCostumeURL(props);
        }
    }
    componentWillReceiveProps (nextProps) {
        if (this.props.costumeURL !== nextProps.costumeURL) {
            this.setState({costumeURL: this.props.costumeURL, timestamp: Date.now()});
        } else if (this.props.assetId !== nextProps.assetId) {
            this.getUpdatedCostumeURL(nextProps);
        }
    }
    shouldComponentUpdate (nextProps, nextState) {
        if (this.props.selected !== nextProps.selected) {
            return true;
        }
        if (this.state.costumeURL !== nextState.costumeURL) {
            return true;
        }
        return false;
    }
    getUpdatedCostumeURL (props) {
        const time = Date.now();
        new Promise((resolve, reject) => {
            if (props.costumeURL) resolve(props.costumeURL);
            if (!props.assetId) reject();

            const storage = props.vm.runtime.storage;
            const asset = storage.get(props.assetId);
            // If the SVG refers to fonts, they must be inlined in order to display correctly in the img tag.
            // Avoid parsing the SVG when possible, since it's expensive.
            if (asset.assetType === storage.AssetType.ImageVector) {
                const svgString = props.vm.runtime.storage.get(props.assetId).decodeText();
                if (svgString.match(HAS_FONT_REGEXP)) {
                    this.svgRenderer.loadString(svgString).then(() => {
                        const svgText = this.svgRenderer.toString(true /* shouldInjectFonts */);
                        resolve(`data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`);
                    }, errorMessage => {
                        reject(errorMessage);
                    });
                } else {
                    resolve(props.vm.runtime.storage.get(props.assetId).encodeDataURI());
                }
            } else {
                resolve(props.vm.runtime.storage.get(props.assetId).encodeDataURI());
            }
        }).then(result => {
            // Since this calculation is async, if it gets called multiple times,
            // results may get out of order. Keep a timestamp whenever setting the costumeURL
            // to make sure we don't overwrite later results.
            if (this.state.timestamp < time) {
                this.setState({costumeURL: result, timestamp: time});
            }
        }, errorMessage => {
            log.error(errorMessage);
        });
    }
    handleMouseUp () {
        this.initialOffset = null;
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('touchend', this.handleMouseUp);
        window.removeEventListener('touchmove', this.handleMouseMove);
        this.props.onDrag({
            img: null,
            currentOffset: null,
            dragging: false,
            dragType: null,
            index: null
        });
        setTimeout(() => {
            this.noClick = false;
        });
    }
    handleMouseMove (e) {
        const currentOffset = getEventXY(e);
        const dx = currentOffset.x - this.initialOffset.x;
        const dy = currentOffset.y - this.initialOffset.y;
        if (Math.sqrt((dx * dx) + (dy * dy)) > dragThreshold) {
            this.props.onDrag({
                img: this.state.costumeURL,
                currentOffset: currentOffset,
                dragging: true,
                dragType: this.props.dragType,
                index: this.props.index,
                payload: this.props.dragPayload
            });
            this.noClick = true;
        }
        e.preventDefault();
    }
    handleMouseDown (e) {
        this.initialOffset = getEventXY(e);
        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('touchend', this.handleMouseUp);
        window.addEventListener('touchmove', this.handleMouseMove);
    }
    handleClick (e) {
        e.preventDefault();
        if (!this.noClick) {
            this.props.onClick(this.props.id);
        }
    }
    handleDelete (e) {
        e.stopPropagation(); // To prevent from bubbling back to handleClick
        this.props.onDeleteButtonClick(this.props.id);
    }
    handleDuplicate (e) {
        e.stopPropagation(); // To prevent from bubbling back to handleClick
        this.props.onDuplicateButtonClick(this.props.id);
    }
    handleExport (e) {
        e.stopPropagation();
        this.props.onExportButtonClick(this.props.id);
    }
    handleMouseLeave () {
        this.props.dispatchSetHoveredSprite(null);
    }
    handleMouseEnter () {
        this.props.dispatchSetHoveredSprite(this.props.id);
    }
    render () {
        const {
            /* eslint-disable no-unused-vars */
            assetId,
            costumeURL,
            dragPayload,
            id,
            index,
            onClick,
            onDeleteButtonClick,
            onDuplicateButtonClick,
            onExportButtonClick,
            receivedBlocks,
            vm,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        return (
            <SpriteSelectorItemComponent
                costumeURL={this.state.costumeURL}
                onClick={this.handleClick}
                onDeleteButtonClick={onDeleteButtonClick ? this.handleDelete : null}
                onDuplicateButtonClick={onDuplicateButtonClick ? this.handleDuplicate : null}
                onExportButtonClick={onExportButtonClick ? this.handleExport : null}
                onMouseDown={this.handleMouseDown}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                {...props}
            />
        );
    }
}

SpriteSelectorItem.propTypes = {
    assetId: PropTypes.string,
    costumeURL: PropTypes.string,
    dispatchSetHoveredSprite: PropTypes.func.isRequired,
    dragPayload: PropTypes.shape({
        name: PropTypes.string,
        body: PropTypes.string
    }),
    dragType: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    index: PropTypes.number,
    name: PropTypes.string,
    onClick: PropTypes.func,
    onDeleteButtonClick: PropTypes.func,
    onDrag: PropTypes.func.isRequired,
    onDuplicateButtonClick: PropTypes.func,
    onExportButtonClick: PropTypes.func,
    receivedBlocks: PropTypes.bool.isRequired,
    selected: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = (state, {id}) => ({
    dragging: state.scratchGui.assetDrag.dragging,
    receivedBlocks: state.scratchGui.hoveredTarget.receivedBlocks &&
            state.scratchGui.hoveredTarget.sprite === id,
    vm: state.scratchGui.vm
});
const mapDispatchToProps = dispatch => ({
    dispatchSetHoveredSprite: spriteId => {
        dispatch(setHoveredSprite(spriteId));
    },
    onDrag: data => dispatch(updateAssetDrag(data))
});

const ConnectedComponent = connect(
    mapStateToProps,
    mapDispatchToProps
)(SpriteSelectorItem);

export {
    ConnectedComponent as default,
    HAS_FONT_REGEXP // Exposed for testing
};
