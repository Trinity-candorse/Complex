/* FILE 3: renderer.js */
/**
 * High-Performance Software Rasterizer & Pixel Compositor
 * Directly writes into raw Canvas ImageData byte buffers.
 * Enhanced with error handling, validation, and optimizations.
 */
export class Renderer {
    constructor(canvas, width, height) {
        // Validate inputs
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
            throw new Error('Renderer: canvas must be a valid HTMLCanvasElement');
        }
        if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
            throw new Error(`Renderer: Invalid dimensions: width=${width}, height=${height}`);
        }

        this.canvas = canvas;
        this.width = width;
        this.height = height;
        
        try {
            this.ctx = canvas.getContext('2d', { alpha: false });
            if (!this.ctx) {
                throw new Error('Failed to get 2D context from canvas');
            }
        } catch (err) {
            throw new Error(`Renderer: Failed to initialize canvas context: ${err.message}`);
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        try {
            this.imageData = this.ctx.createImageData(width, height);
            this.data = this.imageData.data;
        } catch (err) {
            throw new Error(`Renderer: Failed to create ImageData: ${err.message}`);
        }
        
        // Pre-compute lookup color tables for color mapping performance
        this.colorTable = this.generateColorPalette();
        this.isValid = true;
    }

    /**
     * Generate optimized color palette lookup table
     * Uses safe bounds checking to prevent invalid values
     */
    generateColorPalette() {
        const table = new Uint8Array(256 * 4);
        for (let i = 0; i < 256; i++) {
            let t = i / 255.0;
            
            // Safeguard against NaN and out-of-range values
            if (isNaN(t) || t < 0 || t > 1) t = 0;
            
            // Cyberpunk color ramp: Deep Space Black -> Neon Cyan -> Electric Blue -> Pure White
            // Use Math.max/Math.min for safe clamping
            let r = Math.floor(Math.max(0, Math.min(255, Math.sin(t * Math.PI) * 20)));
            let g = Math.floor(Math.max(0, Math.min(255, Math.pow(t, 2) * 255)));
            let b = Math.floor(Math.max(0, Math.min(255, (1.0 - t) * 50 + t * 255)));
            
            // Bright regions
            if (t > 0.8) {
                r = 255; g = 255; b = 255;
            }

            // Store RGBA values
            table[i * 4 + 0] = r;     // R
            table[i * 4 + 1] = g;     // G
            table[i * 4 + 2] = b;     // B
            table[i * 4 + 3] = 255;   // A (always opaque)
        }
        return table;
    }

    /**
     * Render a single frame with cellular automata and particles
     * Includes comprehensive error handling and bounds checking
     */
    renderFrame(engine) {
        if (!this.isValid) {
            console.warn('Renderer: Renderer is invalid, skipping render');
            return;
        }

        // Validate engine state
        if (!engine || !engine.cellState || !engine.particles) {
            console.warn('Renderer: Invalid engine state');
            return;
        }

        const width = this.width;
        const height = this.height;
        const data = this.data;
        const cellState = engine.cellState;
        const colorTable = this.colorTable;
        const engineSize = engine.size;

        try {
            // 1. Render Cellular Automata Grid directly into pixel buffer
            for (let i = 0; i < engineSize && i < width * height; i++) {
                const val = cellState[i];
                
                // Safeguard against invalid values
                if (typeof val !== 'number' || isNaN(val)) {
                    const pIdx = i * 4;
                    // Set pixel to black
                    data[pIdx + 0] = 0;
                    data[pIdx + 1] = 0;
                    data[pIdx + 2] = 0;
                    data[pIdx + 3] = 255;
                    continue;
                }
                
                // Clamp value to [0, 1] range
                const clampedVal = Math.max(0, Math.min(1, val));
                const colorIdx = Math.floor(clampedVal * 255);
                
                const pIdx = i * 4;
                const cIdx = colorIdx * 4;

                // Copy color from lookup table with bounds checking
                data[pIdx + 0] = colorTable[cIdx + 0];
                data[pIdx + 1] = colorTable[cIdx + 1];
                data[pIdx + 2] = colorTable[cIdx + 2];
                data[pIdx + 3] = 255;
            }

            // 2. Render Particle Subsystem with additive color blending
            const particles = engine.particles;
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                // Validate particle object
                if (!p || typeof p !== 'object') continue;
                
                // Validate particle coordinates
                if (typeof p.x !== 'number' || typeof p.y !== 'number' || isNaN(p.x) || isNaN(p.y)) continue;
                
                const px = Math.floor(p.x);
                const py = Math.floor(p.y);

                // Bounds check
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    const pIdx = (py * width + px) * 4;
                    
                    // Additional bounds check on pixel index
                    if (pIdx + 3 < data.length) {
                        // Additive high-intensity magenta spark for particles
                        // Using Math.min to prevent overflow
                        data[pIdx + 0] = Math.min(255, data[pIdx + 0] + 255);
                        data[pIdx + 1] = Math.min(255, data[pIdx + 1] + 50);
                        data[pIdx + 2] = Math.min(255, data[pIdx + 2] + 200);
                        // Alpha channel remains 255
                    }
                }
            }

            // Push buffer to display context in one single high-speed call
            this.ctx.putImageData(this.imageData, 0, 0);
            
        } catch (err) {
            console.error('Renderer: Error during frame rendering:', err);
            // Continue running - don't crash on single frame error
        }
    }

    /**
     * Safely terminate the renderer and free resources
     */
    dispose() {
        this.isValid = false;
        this.ctx = null;
        this.imageData = null;
        this.data = null;
        this.colorTable = null;
    }
}
