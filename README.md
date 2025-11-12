# Clarioo - AI-Powered Vendor Selection

A visual prototype landing page showcasing the Clarioo vendor selection platform. Built with modern web technologies and featuring interactive components with Clearbit-inspired design.

## 🚀 Live Demo

**Live Site**: [https://pangeafate.github.io/Clarioo-Visuals/](https://pangeafate.github.io/Clarioo-Visuals/)

**Repository**: [https://github.com/pangeafate/Clarioo-Visuals](https://github.com/pangeafate/Clarioo-Visuals)

## 📋 Project Overview

This is a visual prototype demonstrating the Clarioo landing page experience. It includes 6 interactive components designed to showcase the platform's capabilities and user journey.

### Key Features

- **Hero Section**: Gradient typography with value proposition badges
- **Registration Toggle**: Sign In/Sign Up toggle with visual feedback
- **Animated Inputs**: Hypnotic animations (pulse-glow, float, shimmer)
- **Artifact Visualization**: Input → AI Processing → Output workflow
- **Interactive Carousel**: 5-step workflow demonstration with auto-rotation
- **Mobile-First Design**: Fully responsive across desktop, tablet, and mobile

### Documentation

📊 **Gap Analysis**: For detailed mapping of user stories to implementation and identified gaps, see [GAP_ANALYSIS.md](./00_IMPLEMENTATION/GAP_ANALYSIS.md)

📚 **Full Documentation**:
- [Architecture](./00_PLAN/ARCHITECTURE.md)
- [Feature List](./00_PLAN/FEATURE_LIST.md)
- [Project Roadmap](./00_IMPLEMENTATION/PROJECT_ROADMAP.md)
- [Progress Tracking](./00_IMPLEMENTATION/PROGRESS.md)
- [User Stories](./00_PLAN/USER_STORIES.md)

## 🛠️ Technologies

- **React 18.3.1** + **TypeScript 5.5.3**
- **Vite 5.4.1** - Build tool and dev server
- **Tailwind CSS 3.4.11** - Utility-first styling
- **Framer Motion 12.23.24** - Animation library
- **Embla Carousel React 8.6.0** - Carousel component
- **shadcn/ui** - Component library (Radix UI)
- **React Router DOM 6.26.2** - Client-side routing

## 🏃 Local Development

### Prerequisites

- **Node.js 20+**
- **npm** or **bun**

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pangeafate/Clarioo-Visuals.git
   cd Clarioo-Visuals
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Local: http://localhost:8080

### Available Scripts

- `npm run dev` - Start development server (port 8080)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 📦 Project Structure

```
src/
├── components/
│   ├── landing/          # Landing page components
│   │   ├── HeroSection.tsx
│   │   ├── RegistrationToggle.tsx
│   │   ├── AnimatedInputs.tsx
│   │   ├── ArtifactVisualization.tsx
│   │   ├── CardCarousel.tsx
│   │   └── LandingPage.tsx
│   ├── ui/               # shadcn/ui components
│   └── vendor-discovery/ # Dashboard components (prototype)
├── hooks/                # Custom React hooks
├── services/             # Mock services for prototype
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## 🎨 Design System

The landing page uses a Clearbit-inspired design system featuring:

- **Custom Color Palette**: Purple gradients with neutral warm tones
- **Multi-Layer Shadows**: Elevated combined shadows for depth
- **Bold Typography**: Gradient text with tight tracking (-0.02em)
- **Keyframe Animations**: Pulse-glow (2s), float (3s), shimmer (4s)
- **Mobile-First Breakpoints**:
  - `md: 768px` (tablet)
  - `lg: 1024px` (desktop)

## 🚢 Deployment

The project automatically deploys to GitHub Pages via GitHub Actions on every push to the `main` branch.

### Manual Deployment

```bash
# Build the project
npm run build

# Preview the build locally
npm run preview
```

The built files are in the `dist/` directory and can be deployed to any static hosting service.

## 📄 License

This is a prototype/demonstration project for Clarioo.

## 🤖 Development

Built with [Claude Code](https://claude.com/claude-code)

---

**Note**: This is a visual prototype. Backend services use mock data for demonstration purposes.
