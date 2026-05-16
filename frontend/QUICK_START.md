# Paper Trail Landing Page - Quick Start Guide

This project is a landing page for Paper Trail, a product that helps people verify AI-generated claims with sources.

## Start in 3 Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the App

```bash
npm run dev
```

The app opens at `http://localhost:5174` or the next free port.

### 3. Edit the App

Make changes in the `src/` folder and the browser will update automatically.

## What the App Includes

- A hero section with the main product message
- Trust and verification sections
- Feature, comparison, workflow, and integration sections
- Testimonials, FAQ, CTA, and footer content
- A tweaks panel for live design changes

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the development server |
| `npm run build` | Build optimized production files in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |

## Folder Guide

```
src/
├── main.jsx
├── App.jsx
├── styles.css
└── components/
    ├── Atoms.jsx
    ├── Nav.jsx
    ├── Hero.jsx
    ├── Features.jsx
    ├── Verification.jsx
    ├── Comparison.jsx
    ├── Workflow.jsx
    ├── Integrations.jsx
    ├── Testimonials.jsx
    ├── FAQ.jsx
    ├── CTA.jsx
    └── Footer.jsx
```

See `STRUCTURE.md` for a detailed breakdown of the app layout.

## Customization

### Change Colors
Edit the CSS variables in `src/styles.css`.

### Use the Tweaks Panel
The built-in panel in the bottom-right corner lets you adjust accent color, dark mode, headline style, and hero animation.

### Add a New Component
1. Create a file in `src/components/`
2. Import the React hooks or atoms you need
3. Export the component as default
4. Import it in `App.jsx`

## Deployment

Run this command for a production build:

```bash
npm run build
```

Then upload the contents of `dist/` to your hosting provider.

## Troubleshooting

### Port already in use?

```bash
npm run dev -- --port 3000
```

### Need to reinstall dependencies?

```bash
npm install
```

### Want to check code quality?

```bash
npm run lint
```
