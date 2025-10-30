# Witness

The frontend application for The Glenn L. Pearson Papers - a digital archive preserving the journals, letters, and writings of Glenn L. Pearson, religion professor, author, and Latter-day Saint.

The name "Witness" reflects Glenn L. Pearson's role as a witness through his extensive journals and writings, and honors his faith as one who bore witness to gospel truths throughout his life.

## Technology Stack

- **React 18**: UI framework
- **Vite 7**: Build tool and dev server
- **React Router 6**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The app will be available at http://localhost:5173

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Project Structure

```
src/
├── main.jsx        # Application entry point with BrowserRouter
├── App.jsx         # Main app component with routes
├── index.css       # Tailwind CSS directives
└── assets/         # Static assets
```

## Routes

- `/` - Home page
- `/browse` - Browse the archive
- `/about` - About the project

## Development

This project uses:

- ESLint for code linting
- Vite's Hot Module Replacement (HMR) for fast development
- Tailwind CSS for styling

## API Integration

The frontend will connect to the Scribe backend API to:

- Fetch archive metadata
- Search extracted content
- Display disk and file information
