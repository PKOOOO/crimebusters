import classes from './GameLayout.module.scss'
import clsx from 'clsx'
import PropTypes from 'prop-types'

export function GameLayout({ children, className, hasBank = true, countFooterSpace = false, hasCustomLayout }) {
    const layoutClassName = clsx(
        classes.layout,
        className,
        {
            [classes.withBank]: hasBank,
            [classes.gameWithoutFooter]: countFooterSpace,
            [classes.gameWithoutFooterWithoutBank]: countFooterSpace && !hasBank,
            [classes.customLayout]: hasCustomLayout
        },
    );

    return (
        <div className={layoutClassName}>
            {children}
        </div>
    )
}

GameLayout.propTypes = {
    className: PropTypes.string,
    hasBank: PropTypes.bool
}