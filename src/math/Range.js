// normalizes value in range to 0-1
export function normalize(value, from, to) {
    return (value - from) / (to - from);
}

// clamp to to min->max
export function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
}

// clamp value to 0-1
export function clampNormal(value) {
    return clamp(value, 0, 1);
}

// map x in a to b to c to d
export function map(x, a, b, c, d) {
    return ((x - a) / (b - a)) * (d - c) + c;
}
