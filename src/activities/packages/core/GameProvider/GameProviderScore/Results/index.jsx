import classes from "./Results.module.scss";
import { Result } from "./Result";
import { useSelector } from "react-redux";

export function Results() {
  const showSolutions = useSelector((state) => state.game.showSolutions);
  const showUserAnswer = useSelector((state) => state.game.showUserAnswer);
  const questions = useSelector((state) => state.game.questions);
  const showUserTries = useSelector((state) => state.game.showUserTries);

  return (
    <div className={classes.container}>
      {questions.map((question, index) => (
        <Result
          showUserAnswer={showUserAnswer}
          key={question.id}
          question={question}
          showSolutions={showSolutions}
          number={index + 1}
          showUserTries={showUserTries}
        />
      ))}
    </div>
  );
}
