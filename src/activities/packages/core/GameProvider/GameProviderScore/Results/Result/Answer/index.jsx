import { TextContainer } from "@educaplay/core";
import classes from "./Answer.module.scss";
import clsx from "clsx";

/**
 * @param {string} className - classes that you want to put on the button.
 * @returns {React.ReactNode} - return a Answer.
 */
export function Answer(props) {
  const {
    acierto,
    j,
    eachAnswer,
    isAnswer = false,
    explanation = null,
  } = props;

  return (
    <>
      <div
        className={clsx(classes.correctAnswer, { [classes.correct]: acierto })}
        key={j}
      >
        <div className={clsx(classes.text, isAnswer && classes.userAnswer)}>
          {eachAnswer}
        </div>
      </div>
      {explanation && (
        <div
          className={clsx(classes.correctAnswer, {
            [classes.correct]: acierto,
          })}
          key={j}
        >
          <TextContainer text={explanation} className={classes.feedback} />
        </div>
      )}
    </>
  );
}
