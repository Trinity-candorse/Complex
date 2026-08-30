/* FILE 3: renderer.js */
/**
 * High-Performance Software Rasterizer & Pixel Compositor
 * Directly writes into raw Canvas ImageData byte buffers.
 */
export class Renderer {
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        this.ctx = canvas.getContext('2d', { alpha: false });
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        this.imageData = this.ctx.createImageData(width, height);
        this.data = this.imageData.data;
        
        // Pre-compute lookup color tables for color mapping performance
        this.colorTable = this.generateColorPalette();
    }

    generateColorPalette() {
        const table = new Uint8Array(256 * 4);
        for (let i = 0; i < 256; i++) {
            let t = i / 255.0;
            // Cyberpunk color ramp: Deep Space Black -> Neon Cyan -> Electric Blue -> Pure White
            let r = Math.floor(Math.sin(t * Math.PI) * 20);
            let g = Math.floor(Math.pow(t, 2) * 255);
            let b = Math.floor((1.0 - t) * 50 + t * 255);
            
            if (t > 0.8) {
                r = 255; g = 255; b = 255;
            }

            table[i * 4 + 0] = r;     // R
            table[i * 4 + 1] = g;     // G
            table[i * 4 + 2] = b;     // B
            table[i * 4 + 3] = 255;   // A
        }
        return table;
    }

    renderFrame(engine) {
        const width = this.width;
        const height = this.height;
        const data = this.data;
        const cellState = engine.cellState;
        const colorTable = this.colorTable;

        // 1. Render Cellular Automata Grid directly into pixel buffer
        for (let i = 0; i < engine.size; i++) {
            const val = cellState[i];
            const colorIdx = Math.floor(val * 255);
            
            const pIdx = i * 4;
            const cIdx = colorIdx * 4;

            data[pIdx + 0] = colorTable[cIdx + 0];
            data[pIdx + 1] = colorTable[cIdx + 1];
            data[pIdx + 2] = colorTable[cIdx + 2];
            data[pIdx + 3] = 255;
        }

        // 2. Render Particle Subsystem with additive color blending directly on top of buffer
        const particles = engine.particles;
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const px = Math.floor(p.x);
            const py = Math.floor(p.y);

            if (px >= 0 && px < width && py >= 0 && py < height) {
                const pIdx = (py * width + px) * 4;
                // Additive high-intensity magenta spark for particles
                data[pIdx + 0] = Math.min(255, data[pIdx + 0] + 255);
                data[pIdx + 1] = Math.min(255, data[pIdx + 1] + 50);
                data[pIdx + 2] = Math.min(255, data[pIdx + 2] + 200);
            }
        }

        // Push buffer to display context in one single high-speed call
        this.ctx.putImageData(this.imageData, 0, 0);
    }
}
