function haversineDistance(radius, lat1, long1, lat2, long2) {
    const deltaLat = lat2 - lat1;
    const deltaLong = long2 - long1;
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
        + Math.cos(lat1) * Math.cos(lat2)
        * Math.sin(deltaLong / 2) * Math.sin(deltaLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return radius * c;
}

/* function cosineLawDistance(radius, lat1, long1, lat2, long2) {
    const x = (long2 - long1) * Math.cos((lat1 + lat2) / 2);
    const y = (lat2 - lat1);

    return Math.sqrt(x * x + y * y) * radius;
} */

// wrap angle by pi*2 radians (360 degrees)
export function wrapAngle(angle) {
    return angle % (Math.PI * 2);
}

export function distanceBetween(radius, lat1, long1, lat2, long2) {
    return haversineDistance(radius, lat1, long1, lat2, long2);
}

// returns min/max lat/long for a given lat/long such that another point is guaranteed to be within
// a given distance if it's within the bounds. if max long < min long, we're wrapping around the
// meridian and both sides need to be checked, i.e. long > min OR long < max rather than AND
// reference: http://janmatuschek.de/LatitudeLongitudeBoundingCoordinates
export function boundingCircle(lat, long, radialDistance) {
    const { PI } = Math;
    const minLat = lat - radialDistance;
    const maxLat = lat + radialDistance;

    // poles not within distance -> calculate long range
    if (minLat > -PI / 2 && maxLat < PI / 2) {
        const deltaLong = Math.asin(Math.sin(radialDistance) / Math.cos(lat));
        let minLong = long - deltaLong;
        let maxLong = long + deltaLong;

        // 'wrap' if crossing 180th, i.e. now max < min
        minLong = minLong < -PI ? minLong + 2 * PI : minLong;
        maxLong = maxLong > PI ? maxLong - 2 * PI : maxLong;

        return {
            minLat, maxLat, minLong, maxLong,
        };
    }

    // pole within distance -> constraint lat range to poles and include all long
    return {
        minLat: Math.max(minLat, -PI / 2),
        maxLat: Math.min(maxLat, PI / 2),
        minLong: -PI,
        maxLong: PI,
    };
}
