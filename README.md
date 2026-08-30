# Autonomous Neural-Cellular Automata Simulation

A high-performance, zero-dependency simulation combining cellular automata with N-body particle physics. Features real-time visualization using Canvas rendering and interactive controls.

## Features

- **Neural-Cellular Automata**: Complex procedural seeding with Moore neighborhood convolution
- **N-Body Physics**: Particle systems with velocity field coupling
- **High Performance**: Optimized typed arrays and direct pixel buffer manipulation
- **Interactive Controls**: Toggle simulation, inject entropy, real-time telemetry
- **Robust Error Handling**: Comprehensive validation and graceful error recovery
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: ARIA labels and keyboard support

## Project Structure

```
├── Index.html       - Main HTML file with styling
├── Engine.js        - Simulation engine (cellular automata + physics)
├── Renderer.js      - Canvas rendering system
├── Controller.js    - UI controller and main loop
└── README.md        - Documentation
```

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/Trinity-candorse/Complex.git
cd Complex
```

2. Open `Index.html` in your browser (or use a local web server)

3. **Controls:**
   - **Toggle Phase Mode** - Pause/resume simulation
   - **Inject Entropy Spike** - Randomize cellular states

## Technical Details

### Simulation Engine
- Grid: 192×108 cells (20,736 total)
- Particle Count: 512 entities
- Update Rate: 60 FPS
- Physics: Continuous-state cellular automata with field coupling

### Rendering
- Software rasterizer with direct pixel buffer access
- Cyberpunk color palette (black → cyan → blue → white)
- Additive color blending for particles
- Optimized single `putImageData()` call per frame

### Performance Optimizations
- Flat Float32Arrays for memory locality
- Pre-computed color lookup tables
- Toroidal boundary conditions (no branches)
- No external dependencies

## Browser Support

- Chrome/Edge 60+
- Firefox 55+
- Safari 10+
- Opera 47+

Requires HTML5 Canvas and ES6 Module support.

## Features Added in v2.0

✅ Comprehensive error handling  
✅ Input validation across all modules  
✅ NaN safeguards and boundary checks  
✅ Graceful error recovery  
✅ Accessibility improvements  
✅ Responsive mobile design  
✅ Cleanup/dispose methods  

## How It Works

1. **Cellular Automata Step**:
   - Each cell examines 8 neighbors (Moore neighborhood)
   - Non-linear activation function determines next state
   - Algorithmic noise modulation based on time

2. **Particle Physics**:
   - Particles sample velocity from cellular grid
   - Forces combine field coupling + sinusoidal motion
   - Damping applied each frame
   - Toroidal wrapping at boundaries

3. **Rendering**:
   - Cells → color lookup table
   - Particles → additive magenta overlay
   - Single frame buffer write per render

## License

MIT License - Feel free to use for personal/educational purposes

## Author

Trinity-candorse

---

**View the live demo**: [GitHub Pages](https://Trinity-candorse.github.io/Complex/) (coming soon after Pages activation)
