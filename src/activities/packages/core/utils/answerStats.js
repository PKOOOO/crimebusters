// Los buckets de estadísticas llegan del backend en orden CANÓNICO: el orden
// original de las respuestas en el XML, donde cada bucket lleva `key` = id de la
// respuesta. Pero en pantalla las respuestas pueden mostrarse permutadas por la
// aleatorización común del match (todos los jugadores y el host ven el mismo
// orden barajado). Si etiquetamos los buckets A/B/C por su índice tal cual, la
// letra del gráfico no coincide con la posición real que se vio en el juego
// (p.ej. el nenúfar "A" de Froggy).
//
// Esta función reordena los buckets para que sigan el mismo orden que `answers`
// (el array de respuestas ya permutado del store, con `id` estable), casando
// `bucket.key` con `answer.id`. Así la letra A/B/C del gráfico coincide con la
// respuesta tal y como se mostró. Si no se pueden casar todos los buckets
// (otros tipos de actividad, respuestas no posicionales, datos incompletos) se
// devuelve el orden original sin tocar, para no arriesgar una regresión.
export function orderBucketsByDisplay(buckets, answers) {
    if (!Array.isArray(buckets) || buckets.length === 0) return buckets;
    if (!Array.isArray(answers) || answers.length === 0) return buckets;

    const bucketsByKey = new Map(buckets.map((bucket) => [String(bucket.key), bucket]));
    const ordered = [];
    for (const answer of answers) {
        const bucket = bucketsByKey.get(String(answer?.id));
        if (!bucket) return buckets; // sin correspondencia → orden original
        ordered.push(bucket);
        bucketsByKey.delete(String(answer?.id));
    }
    // Conservamos cualquier bucket no referenciado por `answers` al final para
    // no perder datos
    for (const bucket of bucketsByKey.values()) ordered.push(bucket);
    return ordered;
}
