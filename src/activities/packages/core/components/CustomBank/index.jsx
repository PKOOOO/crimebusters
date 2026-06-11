import classes from "./CustomBank.module.scss";
import PropTypes from "prop-types";
import clsx from "clsx";
import { Fill } from "@educaplay/core/components";
import { useCustomHandlers } from "../../GameProvider/CustomHandlersProvider/useCustomHandlers";
import { useEffect } from "react";
import { useGameSounds } from "../../hooks";
import { NAME_SOUND_ACTIVE_BANK } from "../../utils";

export const CustomBank = (props) => {
  const { className, children } = props;
  const {
    renders: { infoLeft, infoRight },
  } = useCustomHandlers();

  const gameSounds = useGameSounds();

  useEffect(() => {
    const initAnimation = async () => {
      gameSounds.play(NAME_SOUND_ACTIVE_BANK);
    };

    initAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Fill name="core-custom-bank">
      <div
        className={clsx(
          "core-custom-bank",
          classes.question__content,
          !infoLeft && !infoRight && classes.outpadding,
          className
        )}
      >
        {children}
      </div>
    </Fill>
  );
};

CustomBank.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};
