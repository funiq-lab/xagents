# Component Guidelines

- Prefer function components with hooks; mark interactive client components with `'use client'`.
- Keep components single-purpose; split container logic from presentation.
- Reuse the shadcn + Tailwind primitives under `components/ui/` before adding new styles.
- Pass only the required data through props; avoid reaching into global stores or the router inside deep children.
- Extract side effects or complex state into custom hooks so UI layers stay declarative.
- Source all user-facing text from `locales/{lang}`; never hard-code strings.
- Define explicit TypeScript props and keep exported APIs stable and minimal.
- Forms should pair `react-hook-form` with Zod schemas for validation.
- Render Markdown previews through `react-markdown` to ensure consistent styling.
