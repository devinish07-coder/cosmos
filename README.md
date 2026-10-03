# Cosmos Odyssey: A Journey Through the Universe

A 1:1 replication and elevation of the [Cosmos Odyssey Framer Website](https://secured-organization-926818.framer.app/).

## 🚀 Features & Architecture

- **True 1:1 Framer Design System & Aesthetics**:
  - Cosmic deep space palette: `#030509`, Electric Cyan `#66e8ff`, Cosmic Purple `#9866ff`, Soft Slate `#9baabd`, and Starlight White `#edf4ff`.
  - Authentic Google Fonts typography: `Orbitron` (600, 900) for futuristic mission titles, `Exo 2` for tactical labels & descriptions, and `Inter`.
  - Precise radial gradients, masks, and glassmorphic HUD overlays.
- **The Four Odyssey Chapters**:
  - **01 / DEPARTURE • 400 KM ABOVE HOME**: "Leave Earth Behind" with floating astronaut composition, radial mask, and smooth 6-second floating oscillation.
  - **02 / THE INNER FRONTIER**: "The Asteroid Belt" with interactive 3D perspective asteroid stage, click shockwaves, and 5 drifting fragments with scroll parallax.
  - **03 / WORLDS WITHOUT EDGES**: "Gaseous Giants" featuring a spinning planetary sphere, glowing electric orbital rings tilted at -22°, and a live WebGL raymarched spacetime gravitational mesh.
  - **04 / THE POINT OF NO RETURN**: "The Event Horizon" with a swirling accretion disk and dynamic black hole singularity that dramatically expands on scroll as you fall past the horizon.
- **Interactive Enhancements**:
  - **Procedural Cosmic Ambient Synthesizer**: Web Audio API ambient space drone with audio toggle in the mission masthead.
  - **Interactive 160-Star Particle Field**: Real-time canvas with twinkling, variable depths, and mouse parallax.
  - **Mission Telemetry HUD**: Real-time altitude, velocity, and warp factor tracking.
  - **Quick Chapter Navigation**: Interactive dot progress indicator on the right edge.
- **100% Self-Contained**:
  - All original high-resolution image assets are downloaded locally into `images/`.
  - Zero external JavaScript framework dependencies for blazing fast 60+ FPS performance.

## 🛠️ Running Locally

Run with Node.js:
```bash
npm start
# or
node server.js
```

Open your browser to:
[http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── images/
│   ├── astronaut.jpg
│   ├── asteroid.png
│   ├── gas_giant_texture.png
│   ├── black_hole_desktop.png
│   ├── black_hole_mobile.png
│   ├── favicon-light.png
│   └── favicon-dark.png
├── index.html        # Main HTML5 semantic structure & SEO metadata
├── styles.css        # Complete CSS design system & keyframe animations
├── main.js           # Starfield, WebGL Mesh shader, Audio synth & scroll engine
├── server.js         # Fast native static server
├── package.json      # NPM scripts
└── README.md         # Documentation
```
