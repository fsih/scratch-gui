import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {connect} from 'react-redux';

import styles from '../components/sprite-selector-item/sprite-selector-item.css';
import SpriteSelectorItemComponent from '../components/sprite-selector-item/sprite-selector-item.jsx';

class SpriteSelectorItem extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClick',
            'handleDelete',
            'handleDuplicate',
            'handleMouseOut',
            'handleMouseOver'
        ]);
    }
    componentWillReceiveProps (nextProps) {
        if (this.props.endDragSvg === null && nextProps.endDragSvg !== null) {
            //document.body.appendChild(nextProps.endDragSvg);
            nextProps.endDragSvg.children[0].children[0].setAttribute('class',
                classNames(nextProps.endDragSvg.children[0].children[0].getAttribute('class'), styles.blockShoop));
            const whichAnimationEvent = function (element) {
                let t;

                const animations = {
                    animation: 'animationend',
                    OAnimation: 'oAnimationEnd',
                    MozAnimation: 'animationend',
                    WebkitAnimation: 'webkitAnimationEnd'
                };
                for (t in animations){
                    if (typeof element.style[t] !== 'undefined'){
                        return animations[t];
                    }
                }
            };
            const animationEvent = whichAnimationEvent(nextProps.endDragSvg);
            const listener = function () {
                nextProps.endDragSvg.removeEventListener(animationEvent, listener);
                nextProps.endDragSvg.parentElement.removeChild(nextProps.endDragSvg);
            };
            nextProps.endDragSvg.addEventListener(animationEvent, listener);
        }
    }
    handleClick (e) {
        e.preventDefault();
        this.props.onClick(this.props.id);
    }
    handleDelete () {
        // @todo add i18n here
        // eslint-disable-next-line no-alert
        if (window.confirm('Are you sure you want to delete this?')) {
            this.props.onDeleteButtonClick(this.props.id);
        }
    }
    handleDuplicate (e) {
        e.stopPropagation(); // To prevent from bubbling back to handleClick
        this.props.onDuplicateButtonClick(this.props.id);
    }
    handleMouseOut () {
        this.props.onMouseOut(this.props.id);
    }
    handleMouseOver () {
        this.props.onMouseOver(this.props.id);
    }
    render () {
        const {
            /* eslint-disable no-unused-vars */
            assetId,
            id,
            onClick,
            onDeleteButtonClick,
            onDuplicateButtonClick,
            onMouseOut,
            onMouseOver,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        return (
            <SpriteSelectorItemComponent
                onClick={this.handleClick}
                onDeleteButtonClick={onDeleteButtonClick ? this.handleDelete : null}
                onDuplicateButtonClick={onDuplicateButtonClick ? this.handleDuplicate : null}
                onMouseOut={onMouseOut ? this.handleMouseOut : null}
                onMouseOver={onMouseOver ? this.handleMouseOver : null}
                {...props}
            />
        );
    }
}

SpriteSelectorItem.propTypes = {
    assetId: PropTypes.string,
    costumeURL: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    endDragSpriteId: PropTypes.string,
    endDragSvg: PropTypes.object,
    name: PropTypes.string,
    onClick: PropTypes.func,
    onDeleteButtonClick: PropTypes.func,
    onDuplicateButtonClick: PropTypes.func,
    onMouseOut: PropTypes.func,
    onMouseOver: PropTypes.func,
    selected: PropTypes.bool
};

const mapStateToProps = (state, {id, assetId, costumeURL}) => ({
    costumeURL: costumeURL || (assetId && state.vm.runtime.storage.get(assetId).encodeDataURI()),
    endDragSvg: state.blockdrag.spriteId === id ? state.blockdrag.blockSvg : null
});

export default connect(
    mapStateToProps
)(SpriteSelectorItem);
