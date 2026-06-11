import { NextIcon, SubmitIcon } from "./Icons"
import PropTypes from 'prop-types'
import classes from './NextSubmitButton.module.scss'
import clsx from 'clsx'

export function NextSubmitButton(props) {
    const { showSubmit, className, disabled, active, onFocus, handleOver} = props

    const buttonClasses = clsx({
        [classes.btn]: true,
        [classes.isActive]: active,
        [classes.submitform] : showSubmit
    })

    return (
        <button disabled={disabled} className={clsx(className, buttonClasses)} type="submit" onFocus={onFocus} onMouseEnter={handleOver} >
            {showSubmit ? <SubmitIcon  /> : <NextIcon />}
        </button>
    )
}


NextSubmitButton.propTypes = {
    onCLick: PropTypes.func,
    disabled: PropTypes.bool
}