import { forwardRef, useState, useEffect, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { isMobile } from 'react-device-detect';
import { Triangle as StartIcon } from "@educaplay/core/Icons/Triangle";
import { useTranslate, useFullScreen, useGameSounds, Button, NAME_SOUND_INTRO, DEFAULT_MAIN_COLOR, normalizeColor } from '@educaplay/core';
import { useMatchBackground } from '@educaplay/core/hooks';
import { CountdownLoading } from '../CountdownLoading';
import classes from "./GameProviderMainMenu.module.scss"
import { EducaplayLogo } from "../EducaplayLogo";
import { Footer } from '../Footer';
import { GameProviderMainMenuRoundedEdge } from "./GameProviderMainMenuRoundedEdge";
import { BannerAds } from "../BannerAds";
import { ActivityLogin } from "../ActivityLogin";
import clsx from 'clsx';

export const GameProviderMainMenu = forwardRef(function MainMenu(props, ref) {
    const { onStart, onCountdownStart, gameImage } = props;
    const title = useSelector(state => state.game.title);
    const backgroundImage = useMatchBackground();
    const customBarLogo = useSelector(state => state.settings.customizations.customBarLogo);
    const showEducaplayBrand = useSelector(state => state.settings.customizations.showEducaplayBrand);
    const customLogo = useSelector(state => state.settings.customizations.customLogo);
    const showUser = useSelector(state => state.settings.showUser);
    const [variant, setVariant] = useState('initial');

    const hasDefinedPrimaryColor = !!useSelector(state => state.settings.customizations.colors.iconGameColor && normalizeColor(state.settings.customizations.colors.iconGameColor) !== DEFAULT_MAIN_COLOR);
    const t = useTranslate();
    const [, setFullScreen] = useFullScreen();
    const gameSounds = useGameSounds();

    useImperativeHandle(ref, () => ({
        start: async () => {
            handleStart();
        }
    }));

    const handleStart = () => {
        setVariant('exit')
        if (onCountdownStart) onCountdownStart();
        const startEvent = new CustomEvent("activity-start");
        window.dispatchEvent(startEvent);
        window.parent.postMessage({ type: 'activity-game-started' });

        if (isMobile) {
            setFullScreen(true)
        }

        const soundTimeOut = setTimeout(() => {
            gameSounds.play(NAME_SOUND_INTRO)
            clearTimeout(soundTimeOut);
        }, 3100);

    }

    const handleCountdownEnd = () => {
        onStart();
    }
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleStart();
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showBackgroundImage = !!backgroundImage.src;
    return (
        <motion.div animate={variant} className={classes.background}>
            <motion.div variants={{ exit: { opacity: [0.45, 0.45, 1] } }} transition={{ duration: 3.9, times: [0.2, 0.9, 1] }} className={classes.gradient} style={{ backgroundImage: showBackgroundImage ? 'url(' + backgroundImage.src + ')' : '' }} />
            {showBackgroundImage && <motion.div variants={{ exit: { opacity: [0.45, 0.45, 1] } }} transition={{ duration: 3.9, times: [0.2, 0.9, 1] }} className={classes.imageMask} />}

            <motion.div variants={{ exit: { y: -200 } }} className={classes.logoHeader}>
                {(showEducaplayBrand && !customLogo)  && (<EducaplayLogo className={classes.logo} variant="games" width={96} height={88} alt="Logo Educaplay" />)}
                {customLogo && (<img className={classes.customLogo} width="96" height="88" alt="" src={customLogo} />)}
            </motion.div>

            <motion.div variants={{ exit: { y: "-100vh" } }} transition={{ duration: .75, ease: 'easeOut' }} className={classes.gameData}>
                <div className={clsx(classes.imageWrapper, hasDefinedPrimaryColor && classes.imageWrappercolorBackground)}>
                    <img className={classes.image} width="360" height="360" src={gameImage} alt="" />
                </div>
                <div className={classes.titleWrapper}>
                    <h1 className={classes.gameTitle}>{title}</h1>
                    <h2 className={classes.gameType}>{t('specific.type')}</h2>
                </div>
            </motion.div>

            <motion.div variants={{ exit: { y: "60vh" } }} transition={{ duration: .35, ease: 'easeInOut' }} className={clsx(classes.footerWrapper, !showUser && classes.withoutLogin)}>
                <div>
                    <GameProviderMainMenuRoundedEdge className={classes.decoration} />
                </div>

                {showUser && (<ActivityLogin />)}

                <div className={classes.buttonWrapper}>
                    <Button icon={<StartIcon />} onClick={handleStart} className={classes.actionButton}>
                        {t('common.main.start')}
                    </Button>
                </div>

                <BannerAds />

                <div className={customBarLogo ? classes.franjaPersonalizada : classes.brand}>
                    {(showEducaplayBrand && !customBarLogo)  && (
                        <>
                            <span>
                                <svg className={classes.brandEducaplay} width="197" height="45" viewBox="0 0 197 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" fill='currentColor' clipRule="evenodd" d="M37.0413 33.7002C43.4404 33.7002 48.6814 28.4785 48.7004 22.0793V2.25513C48.7004 1.09668 47.77 0.16626 46.6116 0.16626C45.4534 0.16626 44.5229 1.09668 44.5229 2.25513V13.1165L44.1052 12.7937C42.0544 11.2178 39.6047 10.3821 37.0413 10.3821C30.6042 10.3821 25.3823 15.604 25.3823 22.0413C25.3823 28.4785 30.6042 33.7002 37.0413 33.7002ZM20.1414 24.6238C21.8884 24.6238 23.2935 23.1995 23.2935 21.4717V20.4841C22.5149 14.7307 17.54 10.4011 11.7483 10.4011C5.31128 10.4011 0.0893555 15.623 0.0893555 22.0603V22.2312V22.364C0.0893555 22.364 0.108398 22.7439 0.127441 22.9907C0.602051 29.01 5.69092 33.7192 11.7295 33.7192C14.6157 33.7192 17.407 32.656 19.5527 30.7002C20.2932 29.9216 20.3123 28.7253 19.6096 27.9087C18.8882 27.0732 17.502 26.9783 16.6665 27.7L16.4766 27.8518C15.1284 28.9341 13.4573 29.5417 11.7483 29.5417C8.72925 29.5417 6.03271 27.7568 4.85547 24.9846L5.10229 24.8137V24.6238H20.1414ZM70.7463 23.9211C70.7463 29.2949 66.3789 33.6624 61.0051 33.6624C55.6313 33.6624 51.2639 29.2949 51.2639 23.9211V12.6038C51.2639 11.4075 52.2512 10.4202 53.4475 10.4202C54.6438 10.4202 55.6313 11.4075 55.6313 12.6038V23.9211C55.6313 26.8833 58.0427 29.2949 61.0051 29.2949C63.9673 29.2949 66.3789 26.8833 66.3789 23.9211V12.6038C66.3789 11.4075 67.3662 10.4202 68.5625 10.4202C69.7588 10.4202 70.7463 11.4075 70.7463 12.6038V23.9211ZM90.8362 26.8074C89.4121 28.5354 87.3044 29.5227 85.0637 29.5227C80.9243 29.5227 77.5823 26.1619 77.5823 22.0032C77.5823 17.8828 80.9431 14.5217 85.0637 14.5217C87.3044 14.5217 89.4121 15.509 90.8362 17.2371C91.2351 17.7119 91.8237 17.9966 92.4504 17.9966C92.925 17.9966 93.3997 17.8257 93.7795 17.522C94.1973 17.1802 94.4631 16.6675 94.52 16.1167C94.5771 15.5662 94.4062 15.0344 94.0454 14.5977C91.8047 11.9014 88.5386 10.3633 85.0447 10.3633C78.6077 10.3633 73.3857 15.5852 73.3857 22.0222C73.3857 28.4595 78.6077 33.6814 85.0447 33.6814C88.5386 33.6814 91.8237 32.1433 94.0454 29.4468C94.4062 29.0291 94.5771 28.4785 94.52 27.9277C94.4822 27.377 94.2163 26.8833 93.7795 26.5225C93.3997 26.2188 92.925 26.0479 92.4504 26.0479C91.8237 26.0479 91.2351 26.3328 90.8362 26.8074ZM119.452 31.8203C119.452 32.9788 118.522 33.9092 117.364 33.9092C116.205 33.9092 115.275 32.9788 115.275 31.8203V30.9658L114.857 31.2888C112.806 32.8647 110.357 33.7002 107.793 33.7002C101.356 33.7002 96.134 28.4785 96.134 22.0413C96.134 15.604 101.356 10.3821 107.793 10.3821C114.23 10.3821 119.452 15.604 119.452 22.0603V31.8203ZM140.055 30.3772C141.08 29.2949 141.878 27.9658 142.41 26.3896C142.96 24.8325 143.226 23.0667 143.169 21.0918C143.169 19.1169 142.922 17.427 142.467 16.0217C142.011 14.6167 141.365 13.4583 140.549 12.5278C139.732 11.6165 138.726 10.9329 137.567 10.4961C136.409 10.0593 135.118 9.85059 133.713 9.85059C131.833 9.85059 130.295 10.2302 129.117 10.9709C127.94 11.7114 127.029 12.5659 126.402 13.5154L126.136 10.3821C126.048 10.3625 125.945 10.3481 125.829 10.3362C125.72 10.3247 125.601 10.3154 125.472 10.3062C125.206 10.2874 124.978 10.2874 124.807 10.2874C124.636 10.2874 124.408 10.2874 124.142 10.3062L124.048 10.313L123.963 10.3196C123.905 10.3245 123.848 10.3296 123.795 10.3352C123.751 10.3396 123.709 10.3445 123.669 10.3496C123.6 10.3589 123.535 10.3694 123.478 10.3821V43.8022C123.649 43.8403 123.896 43.8594 124.219 43.8782C124.541 43.8972 124.788 43.8972 124.959 43.8972H125.047C125.104 43.897 125.169 43.8965 125.241 43.895C125.301 43.894 125.367 43.8923 125.437 43.8899C125.512 43.8872 125.594 43.8833 125.68 43.8782C125.822 43.8699 125.953 43.8616 126.07 43.8516C126.219 43.8389 126.344 43.8235 126.44 43.8022V33.0547C126.778 33.1672 127.135 33.2708 127.51 33.3604C127.894 33.4519 128.297 33.5288 128.719 33.5864L128.882 33.6079L129.041 33.6277C129.398 33.6707 129.745 33.7031 130.081 33.7249C130.416 33.7466 130.74 33.7573 131.054 33.7573C133.01 33.7573 134.738 33.4724 136.238 32.8838C137.757 32.2952 139.03 31.4597 140.055 30.3772ZM152.551 33.6145C152.453 33.6216 152.357 33.6274 152.263 33.6318C152.109 33.6392 151.958 33.6433 151.809 33.6433C151.182 33.6433 150.556 33.5674 149.929 33.4346C149.302 33.3015 148.733 33.0547 148.258 32.6748C147.764 32.2952 147.366 31.8015 147.062 31.1558C146.758 30.5103 146.606 29.6748 146.606 28.6304V0.299072C146.698 0.278809 146.811 0.263916 146.946 0.251465C147.063 0.240723 147.197 0.231934 147.347 0.223145L147.448 0.217773L147.562 0.212646L147.66 0.209229C147.698 0.208008 147.733 0.207275 147.768 0.206543H147.774C147.892 0.204346 147.994 0.204346 148.087 0.204346C148.239 0.204346 148.467 0.204346 148.809 0.223145C149.132 0.242188 149.397 0.26123 149.568 0.299072V27.9468C149.568 28.7253 149.663 29.333 149.834 29.7695C150.005 30.2063 150.233 30.5103 150.499 30.719C150.765 30.9089 151.068 31.042 151.391 31.0798L151.452 31.0869C151.752 31.1226 152.034 31.1558 152.284 31.1558C152.606 31.1558 152.948 31.1367 153.309 31.0798C153.67 31.042 153.974 30.9849 154.202 30.928C154.354 31.2888 154.448 31.6685 154.524 32.0862C154.538 32.1858 154.551 32.2832 154.562 32.3787L154.571 32.4492L154.578 32.5144L154.59 32.6177C154.61 32.7893 154.627 32.9553 154.644 33.1172L154.657 33.2446C154.259 33.3774 153.784 33.4915 153.271 33.5483C153.02 33.5754 152.781 33.5981 152.551 33.6145ZM169.734 33.4534C170.612 33.3313 171.412 33.209 172.134 33.0869C172.347 33.0508 172.554 33.0146 172.753 32.9785C172.881 32.9553 173.006 32.9321 173.128 32.9089C173.273 32.8816 173.414 32.8542 173.551 32.8269V17.7307C173.551 15.0154 172.848 13.0217 171.443 11.7493C170.038 10.4771 167.892 9.85059 164.987 9.85059C163.791 9.85059 162.633 9.92651 161.493 10.0974C160.354 10.2683 159.405 10.4583 158.626 10.7051C158.626 10.8145 158.628 10.9253 158.633 11.0371L158.636 11.1079L158.642 11.2043C158.649 11.2959 158.657 11.3884 158.667 11.4822L158.672 11.5208C158.677 11.5627 158.682 11.6047 158.688 11.6475L158.695 11.6956L158.704 11.7566C158.724 11.8848 158.748 12.0151 158.778 12.1482C158.873 12.6418 159.006 13.0405 159.157 13.3064C159.936 13.0596 160.81 12.8696 161.797 12.6987C162.784 12.5278 163.867 12.4519 165.063 12.4519C166.886 12.4519 168.253 12.9077 169.184 13.8191C170.114 14.7307 170.57 16.1738 170.57 18.1487V19.5347C170.154 19.4707 169.629 19.4202 169.008 19.3604L168.652 19.3259C167.873 19.25 166.962 19.2119 165.88 19.2119C164.512 19.2119 163.259 19.3828 162.101 19.7056C160.942 20.0474 159.955 20.5222 159.139 21.1677C158.322 21.8135 157.677 22.592 157.221 23.5413C156.746 24.4907 156.518 25.5542 156.518 26.7505C156.518 29.219 157.316 31.0229 158.911 32.1243C160.506 33.2256 162.708 33.7764 165.481 33.7764C166.829 33.7764 168.234 33.6624 169.734 33.4534ZM186.141 40.0046C185.609 41.6377 184.849 42.7959 183.862 43.4604C182.875 44.125 181.716 44.448 180.368 44.448C179.741 44.448 179.115 44.3909 178.469 44.2771C178.367 44.259 178.267 44.2405 178.171 44.2217C178.104 44.2087 178.039 44.1956 177.975 44.1821L177.854 44.1565L177.78 44.1404C177.434 44.0645 177.132 43.9868 176.874 43.9163C176.874 42.9858 177.102 42.1504 177.539 41.4097C177.785 41.5046 178.127 41.5996 178.621 41.6946C179.096 41.7896 179.627 41.8464 180.235 41.8464C181.108 41.8464 181.792 41.6377 182.324 41.2197C182.855 40.802 183.311 40.0234 183.691 38.8843L185.533 33.3206H184.678C184.413 33.3206 184.109 33.3206 183.767 33.3015C183.425 33.2825 183.159 33.2637 182.988 33.2256L174.747 10.3821C174.918 10.3442 175.184 10.3252 175.507 10.3062C175.83 10.2874 176.152 10.2874 176.456 10.2874C176.703 10.2874 176.988 10.2874 177.349 10.3062C177.415 10.3096 177.478 10.313 177.537 10.3167C177.609 10.3208 177.676 10.3254 177.738 10.3303C177.908 10.3435 178.044 10.3594 178.146 10.3821L185.723 32.5989L193.166 10.3821C193.337 10.3442 193.584 10.3252 193.888 10.3062C194.026 10.2976 194.157 10.293 194.279 10.2905L194.386 10.2888L194.457 10.2881C194.537 10.2874 194.613 10.2874 194.685 10.2874C194.932 10.2874 195.198 10.2874 195.483 10.3062L195.603 10.3142L195.713 10.322C195.747 10.3245 195.78 10.3271 195.812 10.3301C195.906 10.3384 195.991 10.3477 196.07 10.3591C196.117 10.366 196.162 10.3735 196.205 10.3821L186.141 40.0046ZM161.304 23.0642C162.539 22.2288 164.267 21.811 166.507 21.811C167.191 21.811 167.912 21.8491 168.672 21.906C169.431 21.9819 170.058 22.0579 170.571 22.1147V30.6787C169.792 30.8308 168.995 30.9446 168.197 31.0396C167.62 31.1067 167.023 31.1453 166.395 31.1624C166.135 31.1694 165.868 31.1726 165.596 31.1726C164.893 31.1726 164.172 31.1345 163.45 31.0205C162.729 30.9255 162.064 30.7168 161.475 30.394C160.868 30.071 160.393 29.6343 160.013 29.0269C159.652 28.438 159.462 27.6406 159.462 26.6531C159.462 25.0962 160.07 23.8999 161.304 23.0642ZM107.774 14.5596C103.654 14.5596 100.292 17.9207 100.292 22.041C100.292 26.1616 103.654 29.5227 107.774 29.5227C111.895 29.5227 115.256 26.1616 115.256 22.041C115.275 17.9207 111.914 14.5596 107.774 14.5596ZM29.5608 22.041C29.5608 17.9207 32.9219 14.5596 37.0422 14.5596C41.1628 14.5596 44.5239 17.9207 44.5239 22.041C44.5239 26.1616 41.1628 29.5227 37.0422 29.5227C32.9219 29.5227 29.5608 26.1616 29.5608 22.041ZM133.543 12.4897C132.821 12.4897 132.043 12.6038 131.207 12.8506C130.372 13.0974 129.593 13.4961 128.891 14.0847C128.188 14.6733 127.599 15.4331 127.144 16.3635C126.688 17.313 126.441 18.4902 126.441 19.9333V30.3201C127.125 30.5859 127.827 30.7949 128.568 30.9277C129.308 31.0605 130.277 31.1367 131.511 31.1367C132.669 31.1367 133.79 30.9468 134.834 30.5859C135.878 30.2063 136.79 29.6174 137.569 28.8201C138.347 28.0225 138.955 26.9971 139.41 25.7439C139.866 24.5095 140.075 23.0095 140.075 21.2815C140.075 18.5281 139.562 16.3823 138.537 14.8254C137.511 13.2683 135.841 12.4897 133.543 12.4897ZM4.55029 20.1042C5.42383 16.8381 8.38599 14.5596 11.7659 14.5596C15.127 14.5596 18.1082 16.8381 18.9817 20.1042L19.0767 20.427H4.45532L4.55029 20.1042Z"></path>
                                </svg>
                            </span>
                            <span className={classes.brandTxt}>
                                {t('common.main.copy')}
                            </span>
                        </>
                    )}
                    {customBarLogo && (
                        <img className={classes.customImage} width="48" height="16" src={customBarLogo} alt="Logo Banner" />
                    )}
                </div>
            </motion.div>

            <motion.div variants={{ exit: { y: "60vh" } }} transition={{ duration: .35, ease: 'easeInOut' }} className={classes.footerBottom}>
                <Footer />
            </motion.div>

            {variant === "exit" && (
                <div className={classes.countdownLoading}>
                    <motion.div
                        initial={{ opacity: 0, scale: .2 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: .15, duration: .3, ease: "easeIn" }}
                    >
                        <CountdownLoading onCountdownEnd={handleCountdownEnd} />
                    </motion.div>
                </div>
            )}
        </motion.div>
    )
})

GameProviderMainMenu.propTypes = {
    onStart: PropTypes.func,
    onCountdownStart: PropTypes.func,
    gameImage: PropTypes.string,
}