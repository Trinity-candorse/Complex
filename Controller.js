/* FILE 4: controller.js */
/**
 * UI Controller, Telemetry Teleprinter, and System Mainloop Driver
 */
import { SimulationEngine } from './Engine.js';
import { Renderer } from './Renderer.js';

// Configuration parameters for simulation grid density
const MATRIX_WIDTH = 192;
const MATRIX_HEIGHT = 108;

const canvas = document.getElementById('matrixCanvas');
const engine = new SimulationEngine(MATRIX_WIDTH, MATRIX_HEIGHT);
const renderer = new Renderer(canvas, MATRIX_WIDTH, MATRIX_HEIGHT);

let lastTime = performance.now();
let frameCount = 0;
let fpsTimer = 0;

// Telemetry DOM elements
const fpsMetric = document.getElementById('fpsMetric');
const frameTimeMetric = document.getElementById('frameTime');
const nodeCountMetric = document.getElementById('nodeCount');
const entropyMetric = document.getElementById('entropyMetric');

const toggleModeBtn = document.getElementById('toggleModeBtn');
const perturbBtn = document.getElementById('perturbBtn');

let isRunning = true;

toggleModeBtn.addEventListener('click', () => {
    isRunning = !isRunning;
    toggleModeBtn.style.background = isRunning ? '#00ffcc' : '#ffaa00';
    toggleModeBtn.textContent = isRunning ? 'Toggle Phase Mode' : 'System Paused';
});

perturbBtn.addEventListener('click', () => {
    engine.injectEntropy();
});

function mainLoop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    
    frameCount++;
    fpsTimer += delta;

    if (fpsTimer >= 1000) {
        const currentFps = (frameCount * 1000) / fpsTimer;
        fpsMetric.textContent = `FPS: ${currentFps.toFixed(1)}`;
        frameTimeMetric.textContent = `Frame: ${delta.toFixed(2)}ms`;
        entropyMetric.textContent = engine.calculateEntropyIndex();
        
        frameCount = 0;
        fpsTimer = 0;
    }

    if (isRunning) {
        engine.step();
        renderer.renderFrame(engine);
    }

    requestAnimationFrame(mainLoop);
}

// Kickstart execution loop
requestAnimationFrame(mainLoop);
