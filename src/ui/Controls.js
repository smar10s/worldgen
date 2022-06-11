// eslint-disable-next-line import/no-unresolved
import * as THREE from 'https://unpkg.com/three@0.124.0/build/three.module.js';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'https://unpkg.com/three@0.124.0/examples/jsm/controls/OrbitControls.js';
import * as Range from '../math/Range.js';

export default class Controls {
    constructor(world, domElement) {
        this.world = world;
        this.domElement = domElement;
    }

    addCameraControl(camera) {
        const controls = new OrbitControls(camera, this.domElement);
        const { world } = this;

        controls.enableDamping = true;
        controls.dampingFactor = 0.15;
        controls.minDistance = world.radius * 1.1;
        controls.maxDistance = world.radius * 10;
        controls.zoomSpeed = 0.1;

        return controls;
    }

    static createDetailsView() {
        const div = document.createElement('div');

        div.style.position = 'absolute';
        div.style.color = 'green';
        div.style.fontFamily = '\'Courier\', monospace';

        return div;
    }

    createDetailsHtml(lat, long, values) {
        const { world } = this;
        const elevation = values.elevation > world.seaLevel
            ? Range.map(values.elevation, world.seaLevel, world.maxElevation, 0, 8333)
            : Range.map(values.elevation, world.seaLevel, world.minElevation, 0, -10803);

        return `
            <table>
                <tr><td>Lat/Long:</td><td>${((180 / Math.PI) * lat).toFixed(2)}, ${((180 / Math.PI) * long).toFixed(2)} (${lat.toFixed(4)}, ${long.toFixed(4)})</td></tr>
                <tr><td>Elevation:</td><td>${elevation.toFixed()}m (${values.elevation.toFixed(4)})</td></tr>
                <tr><td>Temperature:</td><td>${Range.map(values.temperature, world.minTemperature, world.maxTemperature, -50, 30).toFixed(1)}C (${values.temperature.toFixed(4)})</td></tr>
                <tr><td>Precipitation:</td><td>${Range.map(values.precipitation, 0, world.maxPrecipitation, 0, 200 * 12).toFixed(0)}mm/year (${values.precipitation.toFixed(4)})</td></tr>
            </table>
        `;
    }

    addClickControl(camera, sphere) {
        const { world } = this;
        const details = Controls.createDetailsView();

        document.body.insertBefore(details, this.domElement);

        this.domElement.addEventListener('click', (event) => {
            const x = (event.clientX / window.innerWidth) * 2 - 1;
            const y = -(event.clientY / window.innerHeight) * 2 + 1;
            const clicked = new THREE.Vector3(x, y).unproject(camera);
            const raycaster = new THREE.Raycaster(
                camera.position,
                clicked.sub(camera.position).normalize(),
            );
            const intersects = raycaster.intersectObjects([sphere]);

            if (intersects.length > 0) {
                const { point } = intersects[0];
                const lat = Math.asin(point.y / world.radius);
                const long = Math.atan2(point.z, point.x);
                const values = world.getValuesAt(lat, long);

                details.innerHTML = this.createDetailsHtml(lat, long, values);
            }
        });
    }
}
