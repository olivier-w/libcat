# Contributing to libcat

Thank you for your interest in contributing to libcat! This document provides guidelines and information for contributors.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors of all experience levels.

## How to Contribute

### Reporting Bugs

1. **Search existing issues** first to avoid duplicates
2. **Create a new issue** with a clear title and description
3. Include:
   - Steps to reproduce the bug
   - Expected behavior
   - Actual behavior
   - Your operating system and version
   - Screenshots if applicable

### Suggesting Features

1. **Search existing issues** to see if it's already been suggested
2. **Create a new issue** with the "feature request" label
3. Describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Any alternatives you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the code style guidelines below
3. **Test your changes** by running the app locally
4. **Commit your changes** with clear, descriptive commit messages
5. **Push to your fork** and submit a pull request

## Development Setup

### Prerequisites

- Bun (or Node.js 18+ as fallback)
- FFmpeg installed and in PATH
- Windows Build Tools (for native dependencies)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/olivier-w/libcat.git
cd libcat

# Install dependencies
bun install

# Start development mode
bun run electron:dev
```

### Project Structure

```
libcat/
├── electron/           # Main process (Node.js/Electron)
│   ├── main.ts        # App entry point
│   ├── preload.ts     # IPC bridge
│   └── services/      # Backend services
├── src/               # Renderer process (React)
│   ├── components/    # React components
│   ├── stores/        # Zustand state management
│   ├── styles/        # CSS/Tailwind
│   └── types/         # TypeScript types
└── build/             # App resources
```

## Code Style Guidelines

### General

- Use TypeScript for all new code
- Use functional components with hooks in React
- Keep components focused and single-purpose
- Add comments for complex logic

### Naming Conventions

- **Components**: PascalCase (e.g., `MovieCard.tsx`)
- **Functions/Variables**: camelCase (e.g., `handleClick`, `movieList`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `VIDEO_EXTENSIONS`)
- **Files**: Match the main export (e.g., `MovieCard.tsx` exports `MovieCard`)

### TypeScript

- Define interfaces for props and complex objects
- Avoid `any` type when possible
- Use strict null checks

### React

- Use functional components with hooks
- Keep state as close to where it's used as possible
- Use Zustand store for global state
- Prefer composition over inheritance

### Styling

- Use Tailwind CSS utility classes
- Follow the existing color scheme (see `tailwind.config.js`)
- Use CSS variables for theming when appropriate

## Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(gallery): add grid size toggle
fix(thumbnail): handle missing FFmpeg gracefully
docs(readme): update installation instructions
```

## Testing

Currently, we don't have automated tests. Please manually test your changes:

1. Run the app in development mode
2. Test the affected functionality
3. Check for console errors
4. Test edge cases

## Questions?

If you have questions about contributing, feel free to open an issue with the "question" label.

## License

By contributing to libcat, you agree that your contributions will be licensed under the MIT License.
