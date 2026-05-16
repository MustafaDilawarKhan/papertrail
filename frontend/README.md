# Paper Trail Landing Page

Trust your AI's insights. Verify every claim.

## Overview

Paper Trail is a landing page for checking AI-generated claims against sources and highlighting what was verified. The page includes a hero section, trust signals, comparison tables, workflow steps, integrations, testimonials, FAQ content, and a final call to action.

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Start the App

```bash
npm run dev
```

The app opens in your browser at `http://localhost:5174` or the next available port if that one is busy.

### Build for Production

```bash
npm run build
```

This creates optimized files in the `dist/` folder.

### Preview the Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── main.jsx           # React entry point
├── App.jsx            # Main app shell
├── styles.css         # Global styles and design tokens
├── components/        # Page sections and shared atoms
│   ├── Atoms.jsx
│   ├── Nav.jsx
│   ├── Hero.jsx
│   ├── TrustBar.jsx
│   ├── Features.jsx
│   ├── Verification.jsx
│   ├── Comparison.jsx
│   ├── Integrations.jsx
│   ├── Workflow.jsx
│   ├── Testimonials.jsx
│   ├── FAQ.jsx
│   ├── CTA.jsx
│   ├── Footer.jsx
│   ├── Layout/
│   ├── Sections/
│   └── UI/
├── hooks/
├── utils/
└── assets/
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build the app for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |

## Design System

The app uses CSS custom properties for theming and consistency:

- Colors: `--accent`, `--verify`, `--warn`, `--ink`, `--bg`
- Typography: `--serif`, `--sans`, `--mono`
- Layout tokens: spacing and border radius values
- Dark mode: toggled with the `theme-dark` class on the body

## Technologies

- React 18
- Vite
- CSS custom properties

## Notes

- Hot Module Replacement is enabled for quick iteration
- Source maps are available in production builds
- ESLint is configured for code quality
