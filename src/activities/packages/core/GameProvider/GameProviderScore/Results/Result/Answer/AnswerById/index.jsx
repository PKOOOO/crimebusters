import { CONTENT_TYPE, TYPE_QUESTIONS } from "@educaplay/core/utils";
import classes from './AnswerById.module.scss'
import clsx from "clsx";

import { ImageComponent, TextContainer } from "@educaplay/core";
import AudioContainer from "../../AudioContainer";


export function AnswerByID(props) {

    const { eachAnswer, question, acierto, isAnswer, explanation } = props;
    const answer = eachAnswer?.type === TYPE_QUESTIONS.Text ?
        eachAnswer?.answer
        :
        Array.isArray(eachAnswer?.answer) ?
            eachAnswer?.answer.map(id => { return question.answers.find(answer => answer.id === id) })
            :
            question.answers?.find(answer => answer.id === eachAnswer?.answer)
            // eachAnswer puede ser un array de ids (soluciones) o una respuesta
            // posicional: p.ej. FROGGY_JUMPS guarda answer como índice numérico
            // dentro de question.answers, no como id, así que se resuelve por posición.
            ?? (Array.isArray(eachAnswer)
                ? question.answers?.filter(answer => eachAnswer.includes(answer.id))
                : typeof eachAnswer?.answer === "number"
                    ? question.answers?.[eachAnswer.answer]
                    : undefined)

    const correctAnswer = question.correctAnswers.map(correctAnswer => { return question.answers?.find(answer => answer.id === correctAnswer) });
    return (
        <>
            {isAnswer && (
                <div className={classes.correctAnswer} style={acierto ? { borderColor: "#6EB118" } : { borderColor: "#C2371A" }} key={question.id}>
                    {eachAnswer?.type === TYPE_QUESTIONS.Text && (
                        <div className={clsx(classes.text, isAnswer && classes.userAnswer)}>
                            {answer}
                        </div>
                    )}

                    {(eachAnswer?.type === TYPE_QUESTIONS.Selection) && Array.isArray(eachAnswer?.answer) && (
                        <div className={classes.emptydiv}>
                            {answer.map((answer, id) => {
                                if (answer?.type === CONTENT_TYPE.IMAGE) {
                                    return (
                                        <ImageComponent text={answer.answer} source={answer.source} key={id} isAnswer={isAnswer} className={classes.imageComponent} />
                                    )

                                }

                                if (answer?.type === CONTENT_TYPE.AUDIO) {
                                    return (
                                        <AudioContainer key={id} source={answer.source} text={answer.answer} isAnswer={isAnswer} className={classes.audioComponent} />
                                    )
                                }

                                if (answer?.type === null && answer.answer !== "") {
                                    return (
                                        <TextContainer key={id} isAnswer={isAnswer} text={answer.answer} />
                                    )
                                }

                                return null;
                            })
                            }
                        </div>
                    )}

                    {(eachAnswer?.type === TYPE_QUESTIONS.Selection) && !Array.isArray(eachAnswer?.answer) && (
                        <div className={classes.emptydiv}>
                            {(answer?.type === CONTENT_TYPE.IMAGE) && (<ImageComponent text={answer.answer} source={answer.source} isAnswer={isAnswer} />)}
                            {(answer?.type === CONTENT_TYPE.AUDIO) && (<AudioContainer source={answer.source} text={answer.answer} isAnswer={isAnswer} />)}
                            {(answer?.type === null && answer?.answer != null) && (<TextContainer isAnswer={isAnswer} text={answer.answer} />)}
                        </div>
                    )}

                </div>
            )}
            {!isAnswer && (
                <div className={classes.correctAnswer} style={acierto ? { borderColor: "#6EB118" } : { borderColor: "#C2371A" }}>

                    {correctAnswer.map((answer, id) => {

                        if (answer?.type === CONTENT_TYPE.IMAGE) {
                            return (
                                <ImageComponent text={answer.answer} source={answer.source} key={id} isAnswer={isAnswer} className={classes.imageComponent} />
                            )

                        }

                        if (answer?.type === CONTENT_TYPE.AUDIO) {
                            return (
                                <AudioContainer key={id} source={answer.source} text={answer.answer} isAnswer={isAnswer} className={classes.audioComponent} />
                            )
                        }

                        if (answer?.type === null && answer?.answer !== "") {
                            return (
                                <TextContainer key={id} isAnswer={isAnswer} text={answer.answer} />
                            )
                        }

                        return null;
                    })
                    }

                </div>)}

            {explanation && question.feedback && (
                <div className={classes.correctAnswer} style={acierto ? { borderColor: "#6EB118" } : { borderColor: "#C2371A" }}>
                    <TextContainer text={question.feedback} className={classes.feedback} />
                </div>
            )}
        </>
    )
}