import { useTranslate } from '@educaplay/core/hooks';
import { assetsUrl } from '@educaplay/core';
import { useSelector } from 'react-redux';
import classes from './ActivityLogin.module.scss'

const DEFAULT_AVATAR = assetsUrl('common/usuario.svg');

export function ActivityLogin() {
    const t = useTranslate();
    const loginUrl = useSelector(state => state.settings.login.url);
    const user = useSelector(state => state.game.user);

    if (user) {
        if (user.disabled ?? false) return;

        return (
            <div className={classes.activityLogin}>
                <span className={classes.userAvatar}>
                    <img src={user.image || DEFAULT_AVATAR} width="74" height="76" alt=""/>
                </span>
                <div className={classes.txt}>
                    <span className={classes.identified}></span>
                    <span className={classes.title}>
                        { user.name } {user.lastname}
                    </span>
                </div>
            </div>
        )
    }


    return (
        <div className={classes.activityLogin}>
                <span className={classes.userAvatar}>
                    <img src={DEFAULT_AVATAR} width="74" height="76" alt=""/>
                </span>
                <div className={classes.txt}>
                <a className={classes.notIdentified} href={loginUrl}>
                        {t('common.main.clickHereToIdentifyYourself')}
                    </a>
                </div>
        </div>
    );
}

