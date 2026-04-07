# Duel Monsters Project - Gemini CLI Rules

This file contains fundamental mandates for the AI when working on this monorepo.

## Next.js Rules (apps/web)

When working on the project located in `apps/web/`, these guidelines must be strictly followed:

> **WARNING: This is NOT the standard Next.js.**
> This version contains breaking changes. APIs, conventions, and file structures may differ significantly from your training data.
>
> 1. **Consult Internal Documentation:** Always read the relevant guide in `apps/web/node_modules/next/dist/docs/` before writing any code.
> 2. **Heed Deprecation Notices:** Pay close attention to warnings regarding deprecated functions.
> 3. **Prioritize Local Context:** Do not assume standard Next.js behaviors without first verifying how they are implemented in `apps/web/`.

## Monorepo Structure

*   **apps/web**: Main Next.js application (with the special rules mentioned above).
*   **packages/**: Shared configurations and system libraries.
