/* FILE 4: controller.js */
/**
 * UI Controller, Telemetry Teleprinter, and System Mainloop Driver
 * Enhanced with comprehensive error handling and validation.
 */
import { SimulationEngine } from './Engine.js';
import { Renderer } from './Renderer.js';

// Configuration parameters for simulation grid density
const MATRIX_WIDTH = 192;
const MATRIX_HEIGHT = 108;

// Error handling wrapper
class ControllerState {
    constructor() {
        this.canvas = null;
        this.engine = null;
        this.renderer = null;
        this.isRunning = true;
        this.isValid = false;
        this.lastError = null;
        this.frameHistory = [];
        this.frameHistorySize = 60; // Keep last 60 frames for averaging
    }

    /**
     * Initialize all components with error handling
     */
    initialize() {
        try {
            // Get canvas element
            this.canvas = document.getElementById('matrixCanvas');
            if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement)) {
                throw new Error('Canvas element with id "matrixCanvas" not found or invalid');
            }

            // Initialize simulation engine
            this.engine = new SimulationEngine(MATRIX_WIDTH, MATRIX_HEIGHT);
            if (!this.engine) {
                throw new Error('Failed to initialize SimulationEngine');
            }

            // Initialize renderer
            this.renderer = new Renderer(this.canvas, MATRIX_WIDTH, MATRIX_HEIGHT);
            if (!this.renderer) {
                throw new Error('Failed to initialize Renderer');
            }

            this.isValid = true;
            console.log('✓ System initialized successfully');
            return true;
        } catch (err) {
            this.lastError = err;
            console.error('✗ Initialization failed:', err);
            this.displayError(err.message);
            return false;
        }
    }

    /**
     * Display error message to user
     */
    displayError(message) {
        const errorMsg = `ERROR: ${message}`;
        console.error(errorMsg);
        try {
            const entropyMetric = document.getElementById('entropyMetric');
            if (entropyMetric) {
                entropyMetric.textContent = 'ERROR';
                entropyMetric.style.color = '#ff0055';
            }
        } catch (e) {
            // Silently fail if we can't display error
        }
    }

    /**
     * Calculate average frame time from history
     */
    getAverageFrameTime() {
        if (this.frameHistory.length === 0) return 0;
        const sum = this.frameHistory.reduce((a, b) => a + b, 0);
        return sum / this.frameHistory.length;
    }

    /**
     * Add frame time to history
     */
    recordFrameTime(delta) {
        this.frameHistory.push(delta);
        if (this.frameHistory.length > this.frameHistorySize) {
            this.frameHistory.shift();
        }
    }
}

// Global controller state
let state = new ControllerState();

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeController);
} else {
    initializeController();
}

function initializeController() {
    // Initialize state
    if (!state.initialize()) {
        console.error('Failed to initialize controller. System offline.');
        return;
    }

    // Setup UI elements with null checks
    const fpsMetric = document.getElementById('fpsMetric');
    const frameTimeMetric = document.getElementById('frameTime');
    const nodeCountMetric = document.getElementById('nodeCount');
    const entropyMetric = document.getElementById('entropyMetric');
    const toggleModeBtn = document.getElementById('toggleModeBtn');
    const perturbBtn = document.getElementById('perturbBtn');

    // Verify all required elements exist
    const requiredElements = {
        fpsMetric, frameTimeMetric, nodeCountMetric, entropyMetric,
        toggleModeBtn, perturbBtn
    };

    for (const [name, element] of Object.entries(requiredElements)) {
        if (!element) {
            console.warn(`Warning: Required element '${name}' not found`);
        }
    }

    // Setup telemetry
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;

    /**
     * Main simulation loop with error handling
     */
    function mainLoop(timestamp) {
        if (!state.isValid) {
            console.warn('System is invalid, stopping main loop');
            return;
        }

        try {
            // Calculate frame timing
            const delta = timestamp - lastTime;
            lastTime = timestamp;
            
            // Safeguard against invalid delta
            if (delta < 0 || delta > 1000) {
                console.warn(`Unusual delta detected: ${delta}ms, resetting`);
                lastTime = timestamp;
            } else {
                // Record frame time for averaging
                state.recordFrameTime(Math.min(delta, 100)); // Cap at 100ms to avoid outliers
            }
            
            frameCount++;
            fpsTimer += delta;

            // Update telemetry display
            if (fpsTimer >= 1000) {
                const currentFps = frameCount * 1000 / fpsTimer;
                const avgFrameTime = state.getAverageFrameTime();
                
                if (fpsMetric && !isNaN(currentFps)) {
                    fpsMetric.textContent = `FPS: ${currentFps.toFixed(1)}`;
                }
                if (frameTimeMetric && !isNaN(avgFrameTime)) {
                    // Display average frame time for more accurate representation
                    frameTimeMetric.textContent = `Frame: ${avgFrameTime.toFixed(2)}ms`;
                }
                if (entropyMetric && state.engine) {
                    const entropy = state.engine.calculateEntropyIndex();
                    // Display only the entropy value, not the label
                    entropyMetric.textContent = entropy;
                    entropyMetric.style.color = '#00ffcc'; // Reset color on success
                }
                
                frameCount = 0;
                fpsTimer = 0;
            }

            // Execute simulation step
            if (state.isRunning && state.engine) {
                state.engine.step();
            }

            // Render frame
            if (state.renderer && state.engine) {
                state.renderer.renderFrame(state.engine);
            }

        } catch (err) {
            state.lastError = err;
            console.error('Error in main loop:', err);
            state.displayError(`Loop error: ${err.message}`);
            // Continue running, but log the error
        }

        // Schedule next frame
        requestAnimationFrame(mainLoop);
    }

    /**
     * Toggle simulation pause/resume
     */
    if (toggleModeBtn) {
        toggleModeBtn.addEventListener('click', () => {
            try {
                state.isRunning = !state.isRunning;
                toggleModeBtn.style.background = state.isRunning ? '#00ffcc' : '#ffaa00';
                toggleModeBtn.textContent = state.isRunning ? 'Toggle Phase Mode' : 'System Paused';
            } catch (err) {
                console.error('Error in toggle button:', err);
            }
        });
    }

    /**
     * Inject entropy/perturbation into simulation
     */
    if (perturbBtn) {
        perturbBtn.addEventListener('click', () => {
            try {
                if (state.engine && typeof state.engine.injectEntropy === 'function') {
                    state.engine.injectEntropy();
                    console.log('✓ Entropy injected');
                }
            } catch (err) {
                console.error('Error injecting entropy:', err);
                state.displayError(`Entropy injection failed: ${err.message}`);
            }
        });
    }

    /**
     * Graceful shutdown on page unload
     */
    window.addEventListener('beforeunload', () => {
        try {
            if (state.engine && typeof state.engine.dispose === 'function') {
                state.engine.dispose();
            }
            if (state.renderer && typeof state.renderer.dispose === 'function') {
                state.renderer.dispose();
            }
            state.isValid = false;
        } catch (err) {
            console.error('Error during cleanup:', err);
        }
    });

    // Kickstart execution loop
    console.log('⚡ Starting main loop...');
    requestAnimationFrame(mainLoop);
}
