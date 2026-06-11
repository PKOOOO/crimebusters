import classes from './Switch.module.scss'
import clsx from 'clsx';
import PropTypes from 'prop-types';

export function Switch(props) {

    const {onChange, actived, inputRef} = props;
    
    return (
        <label className={classes.switch} >
            <input type="checkbox" onChange={onChange} checked={actived}  ref={inputRef}/>
            <span className={clsx(classes.slider, classes.round)}></span>
        </label>
    );
}

Switch.propTypes = {
    onClick: PropTypes.func,
    actived: PropTypes.bool,
    inputRef: PropTypes.object
}

