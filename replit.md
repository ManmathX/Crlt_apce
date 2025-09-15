# Space Satellite Research Hackathon Website

## Overview

This is a multi-page interactive website for a space satellite research hackathon called "Team Mama". The project features stunning space-themed animations, satellite tracking capabilities, and educational tools for space research. The website includes multiple sections covering mission information, research areas, active satellites, laboratory experiments, NASA's Astronomy Picture of the Day integration, and contact information.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The application follows a **multi-page static website architecture** with shared assets:

- **HTML Structure**: Separate HTML files for each section (home.html, mission.html, research.html, satellites.html, lab.html, nasa-apod.html, contact.html) with index.html serving as an entry point that redirects to home.html
- **CSS Architecture**: Single shared stylesheet (styles.css) containing all visual styling, animations, and responsive design rules
- **JavaScript Architecture**: Centralized script.js file handling all interactive functionality and animations across pages
- **Navigation Pattern**: Consistent navigation bar across all pages with active state management

### Visual Design System

The project implements a **space-themed design system** with:

- **Animated Background**: Multi-layer starfield with twinkling effects and floating space objects (asteroids, debris, nebulae)
- **Typography**: Custom Google Fonts (Orbitron for headings, Exo 2 for body text) to maintain futuristic aesthetic
- **Color Palette**: Deep space colors (blacks, blues, cyans) with gradient animations
- **Effects**: Glassmorphism design with backdrop blur, parallax scrolling, and smooth transitions

### Interactive Features

The architecture supports several interactive components:

- **Satellite Simulation**: Digital Twin ODIN class for satellite orbit simulations and tracking
- **Physics Calculators**: Built-in tools for orbital mechanics calculations (Vis-Viva equation, Hohmann transfers, Kepler's laws, etc.)
- **Animation System**: CSS and JavaScript-powered animations including smooth scrolling, intersection observer effects, and hover interactions
- **Easter Eggs**: Hidden features like Konami code detection for special animations

### Page Structure

Each page follows a **consistent layout pattern**:

- Animated background layers
- Fixed navigation header
- Page-specific header section with title and subtitle
- Content sections with shared styling classes
- Responsive design that adapts to different screen sizes

## External Dependencies

### Third-Party Services

- **NASA APOD Integration**: The nasa-apod.html page is designed to consume NASA's Astronomy Picture of the Day API for displaying daily space imagery and educational content

### External Libraries

- **Google Fonts API**: Loads Orbitron and Exo 2 font families for consistent typography across the space theme
- **No JavaScript Frameworks**: The project uses vanilla JavaScript for all interactive functionality, avoiding external dependencies

### Browser Dependencies

- **Modern Browser Features**: Utilizes CSS Grid, Flexbox, CSS animations, Intersection Observer API, and ES6+ JavaScript features
- **WebGL/Canvas**: Prepared for potential 3D satellite visualization (referenced in the DigitalTwinODIN class structure)

The architecture prioritizes performance and user experience by keeping dependencies minimal while delivering rich interactive content through native web technologies.