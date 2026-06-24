# Design System — Asshrabha

This document captures the design tokens and component primitives for the premium SaaS redesign.

Principles
- Minimal, elegant, enterprise-grade UI
- Performance-first rendering
- Reusable components and predictable tokens
- Accessibility and keyboard-first interactions

Tokens (source of truth)
- Colors, spacing, radii, shadows, typography are defined in `src/app/globals.css`.
- Breakpoints: mobile, tablet, desktop, large. Use container sizes in `globals.css`.

Component primitives
- `Button` — primary, outline, ghost, sizes
- `Input` — text, search, with error state
- `Card` — elevated surface with shadow variants
- `Topbar` — app header with search and actions
- `BottomNav` — mobile navigation
- `Modal` — accessible modal with focus trap (simple)
- `Icon` — wrapper for lucide-react

Accessibility
- All interactive elements must have keyboard focus styles and ARIA attributes.
- Use semantic HTML and limit reliance on non-semantic containers.

Migration strategy
1. Implement primitives and theme provider (done).
2. Replace repeated inline styles with primitives incrementally, screen-by-screen.
3. Consolidate sidebar/topbar into shared layout components.
4. Add visual polish and motion after functional parity.

Files to review
- `src/app/globals.css` — tokens
- `src/components/ui/*` — primitives (new)
