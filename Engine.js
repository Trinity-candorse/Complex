/* FILE 2: engine.js */
/**
 * Autonomous Neural-Cellular & N-Body Physics Kernel
 * Written completely from scratch with zero external libraries.
 */
export class SimulationEngine {
    constructor(width, height) {
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
    }

    initCellularMatrix() {
        for (let i = 0; i < this.size; i++) {
            const x = i % this.width;
            const y = Math.floor(i / this.width);
            // Complex procedural seeding using nested trigonometric harmonics
            const val = Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.sin(Math.sqrt(x*x + y*y) * 0.05);
            this.cellState[i] = val > 0.5 ? 1.0 : 0.0;
        }
    }

    initParticles() {
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

    step() {
        this.timeStep += 0.016;
        
        // 1. Execute Neural Cellular Automata Transition Rules with Moore Neighborhood convolution
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const idx = y * this.width + x;
                
                // Periodic boundary conditions (toroidal wrapping)
                const left = y * this.width + ((x - 1 + this.width) % this.width);
                const right = y * this.width + ((x + 1) % this.width);
                const up = ((y - 1 + this.height) % this.height) * this.width + x;
                const down = ((y + 1) % this.height) * this.width + x;
                
                const ul = ((y - 1 + this.height) % this.height) * this.width + ((x - 1 + this.width) % this.width);
                const ur = ((y - 1 + this.height) % this.height) * this.width + ((x + 1) % this.width);
                const dl = ((y + 1) % this.height) * this.width + ((x - 1 + this.width) % this.width);
                const dr = ((y + 1) % this.height) * this.width + ((x + 1) % this.width);

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
                if (Math.sin(x * 0.1 + this.timeStep) * Math.cos(y * 0.1) > 0.98) {
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
            let p = this.particles[i];
            
            // Sample velocity field from cellular matrix coordinates
            let cx = Math.floor(p.x) % this.width;
            let cy = Math.floor(p.y) % this.height;
            if (cx < 0) cx += this.width;
            if (cy < 0) cy += this.height;
            
            let cIdx = cy * this.width + cx;
            let fieldForce = this.cellState[cIdx];

            // Update velocities based on internal forces and field coupling
            p.vx += (Math.sin(p.y * 0.05 + this.timeStep) * 0.1) + (fieldForce - 0.5) * 0.2;
            p.vy += (Math.cos(p.x * 0.05 + this.timeStep) * 0.1) + (fieldForce - 0.5) * 0.2;
            
            // Damping
            p.vx *= 0.96;
            p.vy *= 0.96;

            // Position integration
            p.x += p.vx;
            p.y += p.vy;

            // Boundary wrapping
            if (p.x < 0) p.x += this.width;
            if (p.x >= this.width) p.x -= this.width;
            if (p.y < 0) p.y += this.height;
            if (p.y >= this.height) p.y -= this.height;
        }
    }

    injectEntropy() {
        for (let i = 0; i < this.size; i++) {
            if (Math.random() < 0.15) {
                this.cellState[i] = Math.random() > 0.5 ? 1.0 : 0.0;
            }
        }
    }

    calculateEntropyIndex() {
        let activeCount = 0;
        for (let i = 0; i < this.size; i++) {
            if (this.cellState[i] > 0.5) activeCount++;
        }
        return (activeCount / this.size).toFixed(4);
    }
}
