
import PropTypes from 'prop-types';
import classes from './Setting.module.scss'
import { Switch } from '../../Switch'

/**
 * @param {string} Settingmsg - message that represents the option to change.
 * @param {function} onChange - function that is executed when clicked.
 * @param {boolean} actived - indicates if the setting is activated by default.

 * @param {object} inputRef- reference to the switch element.
 * @returns {React.ReactNode} - return Bank. 
 */
export function Setting(props) {
    const {Settingmsg, onChange, inputRef, actived = false} = props;
    
    return (
        <div className={classes.gameswitch}>
            <div className={classes.gameswitchtext}>
                <p>{Settingmsg}</p>
            </div>

            <div className={classes.gameswitchcomponent} >
                <Switch onChange={onChange} actived={actived} inputRef={inputRef}/>
            </div>
        </div>
    );
}

Setting.propTypes = {
    Settingmsg: PropTypes.string,
    onChange: PropTypes.func,
    inputRef: PropTypes.object
}