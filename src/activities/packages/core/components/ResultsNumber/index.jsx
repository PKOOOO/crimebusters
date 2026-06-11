import classes from "./ResultsNumber.module.scss";
import clsx from "clsx";

export function ResultsNumber(props) {
  const { number, className } = props;

  return <div className={clsx(classes.number, className)}>{number + "."}</div>;
}
