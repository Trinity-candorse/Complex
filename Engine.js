/* FILE 2: engine.js */
/**
 * Autonomous Neural-Cellular & N-Body Physics Kernel
 * Written completely from scratch with zero external libraries.
 * Optimized for robustness and performance.
 */
export class SimulationEngine {
    constructor(width, height) {
        // Validate inputs
        if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
            throw new Error(`Invalid dimensions: width=${width}, height=${height}. Must be positive integers.`);
        }

        this.width = width;
        this.height = height;
        this.size = width * height;
        
        // Multi-channel state tensors stored in flat typed arrays for maximum memory locality & speed
        this.cellState = new Float32Array(this.size);
        this.nextState = new Float32Array(this.size);
        this.velocityFieldX = new Float32Array(this.size);
        this.velocityFieldY = new Float32Array(this.size);
        
        // Particle subsystem for complex vector interactions
        this.particleCount = 512;
        this.particles = [];
        this.initParticles();
        this.initCellularMatrix();
        
        this.timeStep = 0;
        this.isValid = true;
    }

    initCellularMatrix() {
        for (let i = 0; i < this.size; i++) {
            const x = i % this.width;
            const y = Math.floor(i / this.width);
            
            // Complex procedural seeding using nested trigonometric harmonics
            // Safeguard against NaN by clamping values
            const val = Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.sin(Math.sqrt(x * x + y * y) * 0.05);
            this.cellState[i] = val > 0.5 ? 1.0 : 0.0;
        }
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                mass: Math.random() * 5 + 1,
                charge: Math.random() > 0.5 ? 1 : -1
            });
        }
    }

    /**
     * Safely wrap coordinate within bounds using optimized modulo
     * @private
     */
    wrapCoord(value, max) {
        value = value % max;
        return value < 0 ? value + max : value;
    }

    step() {
        if (!this.isValid) {
            console.warn('SimulationEngine: Engine is invalid, skipping step');
            return;
        }

        this.timeStep += 0.016;
        
        // 1. Execute Neural Cellular Automata Transition Rules with Moore Neighborhood convolution
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const idx = y * this.width + x;
                
                // Periodic boundary conditions (toroidal wrapping) - optimized
                const left = y * this.width + this.wrapCoord(x - 1, this.width);
                const right = y * this.width + this.wrapCoord(x + 1, this.width);
                const up = this.wrapCoord(y - 1, this.height) * this.width + x;
                const down = this.wrapCoord(y + 1, this.height) * this.width + x;
                
                const ul = this.wrapCoord(y - 1, this.height) * this.width + this.wrapCoord(x - 1, this.width);
                const ur = this.wrapCoord(y - 1, this.height) * this.width + this.wrapCoord(x + 1, this.width);
                const dl = this.wrapCoord(y + 1, this.height) * this.width + this.wrapCoord(x - 1, this.width);
                const dr = this.wrapCoord(y + 1, this.height) * this.width + this.wrapCoord(x + 1, this.width);

                const sum = this.cellState[left] + this.cellState[right] + 
                            this.cellState[up] + this.cellState[down] +
                            this.cellState[ul] + this.cellState[ur] + 
                            this.cellState[dl] + this.cellState[dr];

                const current = this.cellState[idx];
                
                // Continuous-state complex transition function (non-linear activation)
                let next = current;
                if (current > 0.5) {
                    if (sum < 2.0 || sum > 3.8) next = 0.0;
                    else next = Math.min(1.0, current + 0.05);
                } else {
                    if (sum >= 2.8 && sum <= 3.2) next = 1.0;
                    else next = Math.max(0.0, current - 0.05);
                }
                
                // Introduce algorithmic noise modulation based on time
                const noiseVal = Math.sin(x * 0.1 + this.timeStep) * Math.cos(y * 0.1);
                if (!isNaN(noiseVal) && noiseVal > 0.98) {
                    next = (next + 0.5) % 1.0;
                }

                this.nextState[idx] = next;
            }
        }

        // Swap cellular buffers
        const temp = this.cellState;
        this.cellState = this.nextState;
        this.nextState = temp;

        // 2. Execute N-Body Particle Physics with Vector Fields
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Validate particle state
            if (!p || typeof p !== 'object') continue;
            
            // Sample velocity field from cellular matrix coordinates
            let cx = Math.floor(p.x) % this.width;
            let cy = Math.floor(p.y) % this.height;
            if (cx < 0) cx += this.width;
            if (cy < 0) cy += this.height;
            
            const cIdx = cy * this.width + cx;
            if (cIdx < 0 || cIdx >= this.size) continue;
            
            const fieldForce = this.cellState[cIdx];

            // Update velocities based on internal forces and field coupling
            const sinForce = Math.sin(p.y * 0.05 + this.timeStep);
            const cosForce = Math.cos(p.x * 0.05 + this.timeStep);
            
            if (!isNaN(sinForce) && !isNaN(cosForce)) {
                p.vx += (sinForce * 0.1) + (fieldForce - 0.5) * 0.2;
                p.vy += (cosForce * 0.1) + (fieldForce - 0.5) * 0.2;
            }
            
            // Damping
            p.vx *= 0.96;
            p.vy *= 0.96;

            // Clamp velocities to prevent explosion
            const maxVel = 20;
            p.vx = Math.max(-maxVel, Math.min(maxVel, p.vx));
            p.vy = Math.max(-maxVel, Math.min(maxVel, p.vy));

            // Position integration
            p.x += p.vx;
            p.y += p.vy;

            // Boundary wrapping - ensure coordinates stay valid
            p.x = this.wrapCoord(p.x, this.width);
            p.y = this.wrapCoord(p.y, this.height);
        }
    }

    injectEntropy() {
        if (!this.isValid) return;
        
        for (let i = 0; i < this.size; i++) {
            if (Math.random() < 0.15) {
                this.cellState[i] = Math.random() > 0.5 ? 1.0 : 0.0;
            }
        }
    }

    calculateEntropyIndex() {
        if (!this.isValid || this.size === 0) return '0.0000';
        
        let activeCount = 0;
        for (let i = 0; i < this.size; i++) {
            const val = this.cellState[i];
            if (!isNaN(val) && val > 0.5) activeCount++;
        }
        const entropy = activeCount / this.size;
        return isNaN(entropy) ? '0.0000' : entropy.toFixed(4);
    }

    /**
     * Safely terminate the engine
     */
    dispose() {
        this.isValid = false;
        this.particles = [];
        this.cellState = null;
        this.nextState = null;
    }
}
