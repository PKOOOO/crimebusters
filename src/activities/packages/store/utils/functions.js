export function isUnansweredAnswer(answer, options = {}){
    const { examMode = true } = options;
    
    if(answer === null) return true;
    if(answer === "" && examMode) return true;
    if(Array.isArray(answer.answer) && answer.answer.length === 0) return true;
    if(typeof answer === "object" && (answer.answer === null || answer.answer === "")) return true;
    return false;
}