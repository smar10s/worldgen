// random normalized float
export function float() {
    return Math.random();
}

// inclusive float range
export function floatRange(min, max) {
    return (float() * (max - min)) + min;
}

// inclusive integer range
export function integerRange(min, max) {
    return Math.round(floatRange(min, max));
}

// inclusive set of n integers within a range
export function integerSet(n, min, max) {
    const set = [];

    if (min === max || n > (max + 1) - min) {
        throw new Error(`Cannot generate ${n} values between ${min} and ${max}`);
    }

    while (set.length < n) {
        const r = integerRange(min, max);

        if (set.indexOf(r) === -1) {
            set.push(r);
        }
    }

    return set;
}
