// Aplica las permutaciones calculadas por el host en multijugador sobre un
// array local de preguntas. Tanto el host como los jugadores parten del mismo
// array base (lo cargan de la misma actividad), así que al aplicar la misma
// permutación todos acaban viendo el mismo orden.
//
// - questionOrder: array de índices (sobre el array base) con el nuevo orden.
//   Si es null/undefined, no se reordena.
// - answerOrders: { [questionIndexEnElArrayBase]: [idsDeRespuesta] }. Si para
//   una pregunta no hay entrada, se deja el orden original. Si hay entrada,
//   se reordenan las respuestas según esos IDs (se asume `answer.id` estable).

export function applyOrdersToQuestions(questions, { questionOrder = null, answerOrders = null } = {}) {
    if (!Array.isArray(questions) || questions.length === 0) return questions;

    let reordered = questions;
    if (Array.isArray(questionOrder) && questionOrder.length > 0) {
        reordered = questionOrder
            .map((originalIndex) => questions[originalIndex])
            .filter((question) => question !== undefined);
    }

    if (answerOrders && typeof answerOrders === 'object') {
        reordered = reordered.map((question, localIndex) => {
            // La key en answerOrders es el índice de la pregunta en el array
            // original (antes de aplicar questionOrder), porque así se calculó
            // en el host. Resolvemos ese índice aquí
            const baseIndex = (Array.isArray(questionOrder) && questionOrder.length > 0)
                ? questionOrder[localIndex]
                : localIndex;
            const idOrder = answerOrders[baseIndex] ?? answerOrders[String(baseIndex)];
            if (!Array.isArray(idOrder) || !Array.isArray(question?.answers)) return question;

            const answersById = new Map(question.answers.map((answer) => [String(answer.id), answer]));
            const reorderedAnswers = idOrder
                .map((id) => answersById.get(String(id)))
                .filter((answer) => answer !== undefined);
            // Si la permutación no referencia todas las respuestas, conservamos
            // el resto al final para no perder datos
            if (reorderedAnswers.length !== question.answers.length) {
                const referenced = new Set(idOrder.map(String));
                for (const answer of question.answers) {
                    if (!referenced.has(String(answer.id))) {
                        reorderedAnswers.push(answer);
                    }
                }
            }
            return { ...question, answers: reorderedAnswers };
        });
    }

    return reordered;
}

// Calcula una permutación de preguntas/respuestas en el host cuando arranca
// el match. Devuelve { questionOrder, answerOrders } listos para enviar por
// WS. El caller decide qué flags aplica según los settings.
export function buildOrders({ questions, shuffleFn, randomizeQuestions = false, randomizeAnswers = false }) {
    const orders = { questionOrder: null, answerOrders: null };
    if (!Array.isArray(questions) || questions.length === 0) return orders;

    if (randomizeQuestions) {
        const indices = questions.map((_, i) => i);
        orders.questionOrder = shuffleFn(indices);
    }

    if (randomizeAnswers) {
        const answerOrders = {};
        for (let i = 0; i < questions.length; i++) {
            const answers = questions[i]?.answers;
            if (!Array.isArray(answers) || answers.length < 2) continue;
            const ids = answers.map((answer) => answer.id);
            answerOrders[i] = shuffleFn(ids);
        }
        if (Object.keys(answerOrders).length > 0) {
            orders.answerOrders = answerOrders;
        }
    }

    return orders;
}
