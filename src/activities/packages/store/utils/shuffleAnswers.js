import { shuffle } from './shuffle';

// Mezcla el array `answers` de cada pregunta. Asume que cada answer tiene un `id` estable
// y que `correctAnswers` referencia esos IDs (no posiciones), por lo que no necesita remapeo.
// No muta la entrada: devuelve nuevos objetos de pregunta.
export function shuffleAnswersInQuestions(questions) {
    if (!Array.isArray(questions)) return questions;
    return questions.map((question) => {
        if (!Array.isArray(question?.answers) || question.answers.length === 0) {
            return question;
        }
        return {
            ...question,
            answers: shuffle(question.answers),
        };
    });
}
