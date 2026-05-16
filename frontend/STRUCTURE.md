# Paper Trail Landing Page - Project Structure

This document outlines the organized structure of the Paper Trail landing page project.

## Directory Structure

```
aid/
├── public/                    # Static assets (favicon, etc.)
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Main App component
│   ├── styles.css            # Global styles & design tokens
│   │
│   ├── components/           # Reusable React components
│   │   ├── Atoms.jsx         # Shared utility components (FadeUp, Window, etc.)
│   │   ├── Layout/           # Layout wrapper components
│   │   ├── Sections/         # Page section components
│   │   ├── UI/               # Reusable UI elements
│   │   │
│   │   ├── Nav.jsx           # Navigation header
│   │   ├── Hero.jsx          # Hero section
│   │   ├── TrustBar.jsx      # Trust indicators
│   │   ├── Features.jsx      # Features section
│   │   ├── Verification.jsx  # Verification demo
│   │   ├── Comparison.jsx    # Comparison section
│   │   ├── Workflow.jsx      # Workflow section
│   │   ├── Integrations.jsx  # Integrations section
│   │   ├── Testimonials.jsx  # Testimonials section
│   │   ├── FAQ.jsx           # FAQ section
│   │   ├── CTA.jsx           # Call-to-action
│   │   └── Footer.jsx        # Footer
│   │
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility functions
│   ├── assets/               # Images, icons, etc.
│   └── styles/               # Additional CSS files
│
├── index.html                # HTML entry point
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies & scripts
├── .eslintrc.cjs             # ESLint configuration
├── .gitignore                # Git ignore rules
├── README.md                 # Project documentation
└── STRUCTURE.md              # This file
```

## Component Organization

### Atoms (`components/Atoms.jsx`)
Shared utility components and hooks used across the project:
- `useInView()` - Hook for intersection observer-based animations
- `FadeUp` - Component wrapper for fade-up animations
- `Window` - Browser window mockup component
- `Eyebrow` - Small accent text component
- `PlusMark` - Decorative plus signs
- `I` - Icon components (arrow, etc.)

### Main Components
- **Nav** - Sticky header with navigation and theme toggle
- **Hero** - Main hero section with animated flow
- **TrustBar** - Trust indicators and badges
- **Features** - Feature showcase section
- **Verification** - Interactive verification demo
- **Comparison** - Paper Trail vs other tools comparison
- **Workflow** - Workflow/process visualization
- **Integrations** - Third-party integrations showcase
- **Testimonials** - User testimonials
- **FAQ** - Frequently asked questions
- **CTA** - Call-to-action section
- **Footer** - Footer with links

### Custom Hooks
- `useTweaks()` - State management for design tweaks (from tweaks-panel.jsx)

### Utilities
- Various utility components and functions organized in `utils/`

## Design System

The project uses CSS custom properties (variables) for theming:

### Colors
- `--bg` - Primary background
- `--bg-soft` - Soft background
- `--paper` - Paper/card background
- `--ink` - Primary text color
- `--ink-2`, `--ink-3`, `--ink-4` - Text color variations
- `--line`, `--line-2` - Border colors
- `--accent` - Accent color (dynamically configurable)
- `--verify` - Verification/success color
- `--warn` - Warning/error color

### Typography
- `--serif` - Serif font (Instrument Serif)
- `--sans` - Sans-serif font (Geist)
- `--mono` - Monospace font (JetBrains Mono)

### Spacing
- `--radius-sm`, `--radius`, `--radius-lg`, `--radius-xl` - Border radius tokens

## Component Dependencies

```
App
├── Nav (imports: Atoms)
├── Hero (imports: Atoms)
├── TrustBar (imports: Atoms)
├── Features (imports: Atoms)
├── Verification (imports: Atoms)
├── Comparison (imports: Atoms)
├── Workflow (imports: Atoms)
├── Integrations (imports: Atoms)
├── Testimonials (imports: Atoms)
├── FAQ (imports: Atoms)
├── CTA (imports: Atoms)
├── Footer (components)
└── TweaksPanel (imports: tweaks-panel)
```

## Adding New Components

When creating new components:

1. **Create the component file** in the appropriate subdirectory
2. **Add proper imports** at the top:
   ```jsx
   import React from 'react'
   import { FadeUp, Eyebrow } from './Atoms'
   ```
3. **Export as default**:
   ```jsx
   export default MyComponent
   ```
4. **Import in App.jsx** (if it's a page section):
   ```jsx
   import MyComponent from './components/MyComponent'
   ```

## Best Practices

- Keep components small and focused on a single responsibility
- Use the shared Atoms components for consistent styling
- Leverage CSS variables for theming
- Use Vite's built-in hot module reload for rapid development
- Keep component imports organized (React imports first, then local imports)
