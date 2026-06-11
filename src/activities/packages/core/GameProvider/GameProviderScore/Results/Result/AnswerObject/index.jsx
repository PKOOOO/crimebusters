

import { AnswerByID } from '../Answer/AnswerById';

// function AnswerByID() {
// }


/**
 * @param {string} className - classes that you want to put on the button.
 * @returns {React.ReactNode} - return a Answer. 
 */
export function AnswerObject(props) {

    const { acierto, eachAnswer, isAnswer = false, question, explanation=false} = props;

    return (
        <AnswerByID eachAnswer={eachAnswer} question={question} acierto={acierto} isAnswer={isAnswer} explanation={explanation}/>
    )
}