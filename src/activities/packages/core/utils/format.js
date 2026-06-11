export function formatUrl(...urls) {
    return urls.map((url, index) => {
        url = url.trim()
        const lastChar = url[url.length - 1]
        if (lastChar === "/") {
            url = url.slice(0, -1)
        }

        if (index !== 0) {
            const FirstChar = url[0]
            if (FirstChar !== "/") {
                url = "/" + url
            }
        }
        return url
    }).join("")
}

export function removeAccentsAndConvertLowercase(str) {
    if(str == null) return "";
    
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

export function fullTrim(str) {
    if (typeof str !== 'string') return str;

    try {
        // Unicode Property Escapes (ES2018+)
        return str.replace(/^\p{White_Space}+|\p{White_Space}+$/gu, '');
    } catch (e) {
        return str.replace(/^[\s\u00A0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+|[\s\u00A0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+$/g, '');
    }
}