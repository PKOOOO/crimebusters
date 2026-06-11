import PropTypes from 'prop-types';
import clsx from 'clsx';
import classes from './BannerAds.module.scss'
import { useSelector } from 'react-redux';

export function BannerAds(props) {
    const { className, debug = false } = props;
    const showAds = useSelector(state => state.settings.ads);

    const classNames = clsx(
        classes.spaceBannerAds,
        className,
        {[classes.show]: showAds}
    )

    return (
        <div data-debug={debug} className={classNames} />
    )
}

BannerAds.propTypes = {
    className: PropTypes.string,
    debug: PropTypes.bool
}