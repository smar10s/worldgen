// eslint-disable-next-line import/no-unresolved
import * as THREE from 'https://unpkg.com/three@0.124.0/build/three.module.js';
import InterpolatedWorld from '../world/InterpolatedWorld.js';
import Texture from './Texture.js';
import * as Config from './Config.js';
import Controls from './Controls.js';

export default class UI {
    constructor(world, config) {
        this.textureHeight = config.textureHeight || 512;
        this.textureWidth = config.textureWidth || this.textureHeight * 2;

        this.interpolatedWorld = InterpolatedWorld.createIteratively(world, config.detailLevel);
    }

    start() {
        const scene = new THREE.Scene();
        const renderer = UI.createRenderer();
        const camera = this.createCamera();
        const sphere = this.addSphere(scene);
        const controls = new Controls(this.interpolatedWorld, renderer.domElement);
        const cameraControl = controls.addCameraControl(camera);

        function animate() {
            requestAnimationFrame(animate);

            cameraControl.update();
            renderer.render(scene, camera);
        }

        UI.addLights(scene);

        if (Config.should('showPoints')) {
            this.addControlPoints(scene);
        }

        controls.addClickControl(camera, sphere);

        animate();
    }

    static createRenderer() {
        const renderer = new THREE.WebGLRenderer();

        renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(renderer.domElement);

        return renderer;
    }

    static addLights(scene) {
        const directionalLight = new THREE.DirectionalLight(0x404040, 1); // light grey

        directionalLight.position.set(50, 0, 50);

        scene.add(new THREE.AmbientLight(0xffffff, 1)); // white

        scene.add(directionalLight);
    }

    createCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

        camera.position.z = this.interpolatedWorld.radius * Math.PI * 0.6; // zoom back a bit;

        return camera;
    }

    addControlPoints(scene) {
        const world = this.interpolatedWorld;
        const geometry = new THREE.Geometry();
        const pointSize = world.radius / 100;

        geometry.vertices = world.controlPoints.map((controlPoint) => new THREE.Vector3(
            world.radius * Math.cos(controlPoint.lat) * Math.cos(controlPoint.long),
            world.radius * Math.sin(controlPoint.lat),
            world.radius * Math.cos(controlPoint.lat) * Math.sin(controlPoint.long),
        ));

        scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: pointSize, color: 'red' })));
    }

    addSphere(scene) {
        const texture = new Texture(this.interpolatedWorld, this.textureWidth, this.textureHeight);
        const geometry = new THREE.SphereBufferGeometry(this.interpolatedWorld.radius, 32, 32);
        const sphere = new THREE.Mesh(
            geometry,
            texture.createSphereMaterials(),
        );

        geometry.addGroup(0, geometry.index.count, 0);
        geometry.addGroup(0, geometry.index.count, 1);
        geometry.addGroup(0, geometry.index.count, 2);

        scene.add(sphere);

        return sphere;
    }
}
