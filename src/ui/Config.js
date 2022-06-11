const params = new URLSearchParams(window.location.search);

export function has(key) {
    return params.has(key);
}

export function get(key, defaultValue = null) {
    if (params.has(key)) {
        return params.get(key);
    }

    return defaultValue;
}

export function should(key) {
    return get(key) === 'true';
}
