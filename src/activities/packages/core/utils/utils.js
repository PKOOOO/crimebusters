export function sizeCalc(long) {
    if (long < 3) {
        return "--xl";
    } else if (long < 25) {
        return "--l";
    } else if (long < 51) {
        return "--m";
    } else if (long < 125) {
        return "--s";
    } else {
        return "--xs";
    }
}

export const clone = (obj) => {
    if (typeof window.structuredClone === 'function') {
        return window.structuredClone(obj);
    }

    return JSON.parse(JSON.stringify(obj));
}

export function getLastCharacter(str) {
    const normalizedStr = str.trim();

    if (normalizedStr.length > 0) {
        return normalizedStr.charAt(normalizedStr.length - 1);
    }
    return "";
}