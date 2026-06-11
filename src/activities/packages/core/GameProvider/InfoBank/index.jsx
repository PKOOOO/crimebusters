import classes from './InfoBank.module.scss'
import PropTypes from 'prop-types';
import { Slot, useSlot } from '@educaplay/core/components';

/**
 * @param {integer} rightWordsCount - number of correct words on the current page.
 * @param {integer} wordsCount - number of words on the current page.
 * @param {integer} actualPage - current page in which we are.
 * @param {integer} pagesCount - number of pages in the activity.
 * @returns {React.ReactNode} - return info of the bank.
 */
export function InfoBank (props) {
    const {infoLeft = null, infoRight=null} = props;
    // Si alguien rellena el Slot (p.ej. el host multijugador emite su propio
    // contador), tiene prioridad sobre la prop del juego para evitar duplicado
    const hasSlotLeft = useSlot('core-bank-left');
    const hasSlotRight = useSlot('core-bank-right');

    return (
        <div className={classes.info}>
            <div className={classes.pill}>
                <Slot name="core-bank-left" />
                {!hasSlotLeft && infoLeft}
            </div>
            <div className={classes.pill}>
                <Slot name="core-bank-right" />
                {!hasSlotRight && infoRight}
            </div>
        </div>
    )
}

InfoBank.propTypes = {
    infoLeft: PropTypes.node,
    infoRight: PropTypes.node,
}
