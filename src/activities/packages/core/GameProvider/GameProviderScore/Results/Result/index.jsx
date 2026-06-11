import { Check } from "@educaplay/core/Icons/Check";
import { Wrong } from "@educaplay/core/Icons/Wrong";
import { Answer } from "./Answer";
import classes from "./Result.module.scss";
import clsx from "clsx";
import { AnswerObject } from "./AnswerObject";
import { ResultsNumber, ResultsBank } from "@educaplay/core/components";
import { isUnansweredAnswer } from "@educaplay/store/utils/functions";

/**
 * @param {string} className - classes that you want to put on the button.
 * @returns {React.ReactNode} - return a Result.
 */
export function Result(props) {
  const { question, showSolutions, showUserAnswer, number, showUserTries } =
    props;
  const { correctAnswers, answer } = question;
  const isCorrect = answer && question.checkAnswer(answer);

  function allCanParseToNumber(array) {
    const filterScreenID = /^\d+-\d+$/;
    const isScreenID = array.every((element) => filterScreenID.test(element));
    const isAllNumber = array.every((element) => !isNaN(element));
    return isScreenID || isAllNumber;
  }

  return (
    <div
      className={clsx(
        classes.answer,
        isCorrect ? classes.rightAnswer : classes.wrongAnswer
      )}
    >
      <ResultsNumber number={number} />

      <div className={classes.leftSide}>
        <ResultsBank media={question.media} text={question.text} />

        {showUserTries &&
          !isCorrect &&
          question.tries &&
          question.tries.length > 0 &&
          question.tries.map((tryAnswer, index) => (
            <div key={index}>
              <Answer
                key={index}
                acierto={false}
                eachAnswer={
                  !Array.isArray(tryAnswer) && typeof tryAnswer === "object"
                    ? tryAnswer.answer
                    : tryAnswer
                }
                isAnswer
              />
            </div>
          ))}

        {showUserAnswer &&
          !isCorrect &&
          !isUnansweredAnswer(question.answer, { examMode: false }) &&
          (!Array.isArray(question.answer) &&
          typeof question.answer === "object" ? (
            <AnswerObject
              key={number}
              acierto={isCorrect}
              eachAnswer={question.answer}
              question={question}
              isAnswer
            />
          ) : (
            <Answer
              key={number}
              acierto={isCorrect}
              eachAnswer={
                Array.isArray(question.answer)
                  ? question.answer.join(", ")
                  : question.answer
              }
              isAnswer
            />
          ))}

        {showSolutions &&
          correctAnswers &&
          (Array.isArray(correctAnswers) &&
          allCanParseToNumber(correctAnswers) ? (
            <AnswerObject
              key={number + 1}
              acierto={isCorrect}
              eachAnswer={correctAnswers}
              question={question}
              explanation
            />
          ) : (
            <Answer
              key={number + 1}
              acierto={isCorrect}
              eachAnswer={correctAnswers.join(", ")}
              explanation={question.feedback}
            />
          ))}
      </div>
      <div
        className={clsx(classes.rightSide, { [classes.correct]: isCorrect })}
      >
        {isCorrect ? <Check /> : <Wrong />}
      </div>
    </div>
  );
}
