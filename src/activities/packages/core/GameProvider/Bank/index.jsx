import classes from "./Bank.module.scss";
import PropTypes from "prop-types";
import { motion, useAnimation } from "framer-motion";
import clsx from "clsx";
import { forwardRef, useEffect, useState, useImperativeHandle, useCallback } from "react";
import {
  CONTENT_TYPE,
  NAME_SOUND_ACTIVE_BANK,
  sizeCalc,
  useGameSounds,
} from "@educaplay/core";
import { IconButton } from "@educaplay/core/components";
import { Search } from "@educaplay/core/Icons/Search";
import { useSelector } from "react-redux";
import { useCustomHandlers } from "../CustomHandlersProvider/useCustomHandlers";
import { Dialog } from "@educaplay/core/components";
import { InfoBank } from "../InfoBank";
import { YouTubeComponent } from "@educaplay/core/components";
import { AudioComponentControl } from "../../components/AudioComponentControl";
import { Slot, useSlot } from "@educaplay/core/components";
import { VideoComponent } from "../../components/VideoComponent";

/**
 * @param {array} content - content of all of the questions.
 * @param {number} index - actual question.
 * @param {React.node} infoBank - component infobank.
 * @returns {React.ReactNode} - return Bank.
 */

export const Bank = forwardRef(function Bank(props, ref) {
  const { className, hasBank } = props;

  const {
    renders: { infoLeft, infoRight },
  } = useCustomHandlers();
  const gameSounds = useGameSounds();
  const [openImage, setOpenImage] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const controls = useAnimation();

  const isBankHidden = useSelector((state) => state.game.isBankHidden);
  const questions = useSelector((state) => state.game.questions);
  const currentIndex = useSelector((state) => state.game.currentIndex);
  const showBankControl = useSelector((state) => state.game.showBankControl);
  const isAnimating = useSelector((state) => state.game.isAnimating);
  const bankOffsetY = useSelector((state) => state.game.bankOffsetY);

  const [currentContent, setCurrentContent] = useState(null);
  const [isBankAnimating, setIsBankAnimating] = useState(false);
  const titleSize = currentContent?.title?.length ?? 0;
  const descriptionSize = currentContent?.text?.length ?? 0;
  const size = titleSize + descriptionSize;
  const sizeClass = sizeCalc(size);
  const hasSlotContent = useSlot("core-custom-bank");

  const hasContent = !!(
    currentContent?.text ||
    currentContent?.title ||
    currentContent?.source
  );
  const hasAdditionalText = currentContent?.text || currentContent?.title;

  const alingCenter =
    (currentContent?.text?.length ?? 0) < 250 && !currentContent?.source;

  const hasBankContent = (hasBank && hasContent) || hasContent || hasSlotContent;

  const hasInfoBankContent = !!(infoLeft?.(currentIndex, questions) || infoRight?.(currentIndex, questions));

  const shouldShowBank = hasBankContent || hasInfoBankContent;

  const playBankSound = useCallback((content) => {
    if (content?.text || content?.title || content?.source) {
      gameSounds.play(NAME_SOUND_ACTIVE_BANK);
    }
  }, [gameSounds]);

  useImperativeHandle(ref, () => ({
    animateEntry: async () => {
      const content = questions[currentIndex]?.bank;
      setCurrentContent(content);
      playBankSound(content);
      setIsReady(true);

      if (shouldShowBank && showBankControl) {
        await controls.start({
          y: "0%",
          opacity: 1,
          transition: { duration: 0.5, type: "spring", bounce: 0.5 }
        });
      }
    },
    animateExit: async () => {
      await controls.start({
        y: "-180%",
        opacity: 0,
        transition: { duration: 0.5, type: "spring", bounce: 0.5 }
      });
      setIsReady(false);
    },
  })); const OpenImage = () => {
    setOpenImage(true);
  };

  useEffect(() => {
    if (!isReady) return;

    const animateVisibility = async () => {
      controls.stop();

      if (showBankControl) {
        await controls.start({
          y: "0%",
          opacity: 1,
          transition: { duration: 0.5, type: "spring", bounce: 0.5 }
        });
      } else {
        await controls.start({
          y: "-180%",
          opacity: 0,
          transition: { duration: 0.5, type: "spring", bounce: 0.5 }
        });
      }
    };

    animateVisibility();
  }, [showBankControl, isReady, controls]); useEffect(() => {
    if (!isReady) {
      setCurrentContent(questions[currentIndex]?.bank);
      return;
    }

    if (!showBankControl) {
      setCurrentContent(questions[currentIndex]?.bank);
      return;
    }

    const animate = async () => {
      const nextContent = questions[currentIndex]?.bank;

      // Verificar si realmente cambió el contenido
      const contentHasChanged =
        currentContent?.text !== nextContent?.text ||
        currentContent?.title !== nextContent?.title ||
        currentContent?.source !== nextContent?.source ||
        currentContent?.type !== nextContent?.type;

      if (!contentHasChanged) {
        return;
      }

      // Detener cualquier animación en curso (esto interrumpe la animación actual)
      controls.stop();

      const hasCurrentContent = !!(currentContent?.text || currentContent?.title || currentContent?.source);
      const hasNextContent = !!(nextContent?.text || nextContent?.title || nextContent?.source);

      setIsBankAnimating(true);

      // PASO 1: Si hay contenido actual, animarlo saliendo (subir)
      if (hasCurrentContent) {
        await controls.start({
          y: "-180%",
          opacity: 0,
          transition: { duration: 0.5, type: "spring", bounce: 0.5 }
        });
      }

      // PASO 2: Cambiar el contenido mientras está oculto
      setCurrentContent(nextContent);
      playBankSound(nextContent);

      await new Promise(resolve => setTimeout(resolve, 50));

      // PASO 3: Si hay nuevo contenido, animarlo entrando (bajar)
      if (hasNextContent) {
        await controls.start({
          y: "0%",
          opacity: 1,
          transition: { duration: 0.5, type: "spring", bounce: 0.5 }
        });
      }

      setIsBankAnimating(false);
    };

    animate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isReady, questions, showBankControl, controls, playBankSound]);

  return (
    <motion.div
      initial={{
        y: "-150%",
        opacity: 0,
      }}
      animate={controls}
      style={{ marginTop: `${bankOffsetY || 0}px` }}
      className={clsx(classes.wrapper, className)}
      onMouseDown={(e) => {
        e.preventDefault();
      }} // previene que si algo del juego tiene el foco, al hacer click en el banco, no se pierda el foco del juego
    >
      <div className={classes["sub-header"]}>
        <div
          className={clsx(classes.question, {
            [classes.color]: !isBankHidden && hasBankContent && isReady,
          })}
        >
          <InfoBank
            infoLeft={infoLeft?.(currentIndex, questions)}
            infoRight={infoRight?.(currentIndex, questions)}
          />

          <Slot name="core-custom-bank" />

          {!isBankHidden && (
            <>
              {hasBankContent && !hasSlotContent && (
                <div
                  className={clsx(
                    classes.question__content,
                    !infoLeft && !infoRight && classes.outpadding,
                    classes[sizeClass]
                  )}
                >
                  {currentContent?.type === CONTENT_TYPE.IMAGE && (
                    <>
                      <div className={classes.containerImg}>
                        <div className={classes.sourceImg}>
                          <Dialog
                            open={openImage}
                            onClose={() => setOpenImage(false)}
                            variant="lightbox"
                          >
                            <img src={currentContent?.source} alt="" />
                          </Dialog>
                          <img
                            src={currentContent?.source}
                            onClick={OpenImage}
                          />
                          <IconButton
                            icon={<Search />}
                            onClick={OpenImage}
                            className={classes.expand}
                          />
                        </div>
                      </div>
                      {hasAdditionalText && (
                        <div
                          className={clsx(
                            classes.containertext,
                            (titleSize > 50 || descriptionSize > 180) &&
                            classes.containertextscroll,
                            classes.scrollbar,
                            alingCenter && classes.alingCenter
                          )}
                        >
                          {currentContent?.title && (
                            <p className={classes.title}>
                              {currentContent?.title}
                            </p>
                          )}
                          <p>{currentContent?.text}</p>
                        </div>
                      )}
                    </>
                  )}

                  {currentContent?.type === CONTENT_TYPE.AUDIO && (
                    <>
                      <div className={classes.audioSrc}>
                        <AudioComponentControl
                          key={currentIndex}
                          source={currentContent?.source}
                          autoplay={isReady && showBankControl && !isBankHidden && !isAnimating && !isBankAnimating}
                        />
                      </div>
                      {hasAdditionalText && (
                        <div
                          className={clsx(
                            classes.containertext,
                            (titleSize > 50 || descriptionSize > 180) &&
                            classes.containertextscroll,
                            classes.scrollbar,
                            alingCenter && classes.alingCenter
                          )}
                        >
                          {currentContent?.title && (
                            <p className={classes.title}>
                              {currentContent?.title}
                            </p>
                          )}
                          <p>{currentContent?.text}</p>
                        </div>
                      )}
                    </>
                  )}
                  {
                    currentContent?.type === CONTENT_TYPE.VIDEO && (
                      <>
                        <div className={classes.containerVideo}>
                          <VideoComponent url={currentContent?.source} thumbnail={currentContent?.thumbnail} />
                        </div>
                        {hasAdditionalText && (
                          <div
                            className={clsx(
                              classes.containertext,
                              (titleSize > 50 || descriptionSize > 180) &&
                              classes.containertextscroll,
                              classes.scrollbar,
                              alingCenter && classes.alingCenter
                            )}
                          >
                            {currentContent?.title && (
                              <p className={classes.title}>
                                {currentContent?.title}
                              </p>
                            )}
                            <p>{currentContent?.text}</p>
                          </div>
                        )}
                      </>
                    )
                  }

                  {currentContent?.type === CONTENT_TYPE.YOUTUBE && (
                    <>
                      <div className={classes.containerYoutube}>
                        <YouTubeComponent url={currentContent?.source} />
                      </div>
                      {hasAdditionalText && (
                        <div
                          className={clsx(
                            classes.containertext,
                            (titleSize > 50 || descriptionSize > 180) &&
                            classes.containertextscroll,
                            classes.scrollbar,
                            alingCenter && classes.alingCenter
                          )}
                        >
                          {currentContent?.title && (
                            <p className={classes.title}>
                              {currentContent?.title}
                            </p>
                          )}
                          <p>{currentContent?.text}</p>
                        </div>
                      )}
                    </>
                  )}

                  {currentContent?.type === CONTENT_TYPE.TEXT && (
                    <div
                      className={clsx(
                        classes.containertext,
                        (titleSize > 50 || descriptionSize > 180) &&
                        classes.containertextscroll,
                        classes.scrollbar,
                        alingCenter && classes.alingCenter
                      )}
                    >
                      {currentContent?.title && (
                        <p className={classes.title}>{currentContent?.title}</p>
                      )}
                      <p>{currentContent?.text}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
});

Bank.propTypes = {
  content: PropTypes.shape({
    text: PropTypes.string,
    source: PropTypes.string,
  }),
  contentType: PropTypes.string,
  showQuestion: PropTypes.bool,
  index: PropTypes.number,
  infoBank: PropTypes.node,
  animated: PropTypes.bool,
  className: PropTypes.string,
  hasBank: PropTypes.bool,
};
