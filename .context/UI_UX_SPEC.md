# UI/UX Specification

This file documents the visual design, layout, and interaction patterns for your application. It helps AI assistants understand exactly how the UI should look and behave.

## Purpose

A UI/UX spec helps AI assistants:

- Generate consistent UI code that matches your vision
- Understand screen-by-screen layouts
- Implement correct interaction patterns
- Apply appropriate styling and theming

## Recommended Sections

### Design System

Document your foundational design choices:

```markdown
- **Framework**: shadcn/ui components with Tailwind CSS 4
- **Font**: Geist (already configured in this starter)
- **Theme**: Light/dark mode support (existing)
- **Style**: Clean, minimal, card-based layouts
```

### Screen Layouts

Use ASCII diagrams to show the structure of each screen. This is extremely helpful for AI assistants to understand spatial relationships.

```
+------------------------------------------+
| [drag region / title bar]    [-] [x] [+] |
+------------------------------------------+
| +--------+ +---------------------------+ |
| | Sidebar| |      Main Content         | |
| |        | |                           | |
| |  Nav   | |   Your app content here   | |
| |  Items | |                           | |
| +--------+ +---------------------------+ |
+------------------------------------------+
```

### Component States

Document different states for interactive components:

```markdown
### Button States

- Default: Normal appearance
- Hover: Subtle highlight
- Active/Pressed: Darker shade
- Disabled: Grayed out, no interaction
- Loading: Show spinner, disable clicks
```

### Color Tokens

Define your color palette using CSS variables or design tokens:

```markdown
Background:

- Page: hsl(0 0% 100%)
- Card: hsl(0 0% 100%)
- Sidebar: hsl(0 0% 98%)

Foreground:

- Primary: hsl(0 0% 9%)
- Muted: hsl(0 0% 45%)

Accents:

- Primary: hsl(221 83% 53%) (blue)
- Success: hsl(142 71% 45%) (green)
- Warning: hsl(38 92% 50%) (yellow)
- Destructive: hsl(0 84% 60%) (red)
```

### Keyboard Shortcuts

List any keyboard shortcuts your app should support:

| Key          | Action      |
| ------------ | ----------- |
| Ctrl/Cmd + S | Save        |
| Ctrl/Cmd + N | New item    |
| Escape       | Close modal |

### Animations

Describe motion and transitions:

- **Modal open/close**: Fade in/out with scale (200ms ease)
- **Button hover**: Subtle color transition (150ms)
- **Loading states**: Spinner rotation or skeleton pulse

### Error States

Document how errors should be displayed:

- Inline validation errors below form fields
- Toast notifications for transient errors
- Modal dialogs for critical errors requiring action

### Responsive Behavior

Describe how the layout adapts to different window sizes:

- **Wide (>1200px)**: Full sidebar, spacious content area
- **Medium (800-1200px)**: Narrower sidebar
- **Narrow (<800px)**: Collapsible sidebar or mobile layout

---

## Tips

1. **Be specific**: Instead of "nice looking button", describe the exact colors, padding, and border radius
2. **Use ASCII art**: Visual diagrams help AI understand layout better than prose
3. **Document all states**: Hover, active, disabled, loading, error, empty
4. **Include measurements**: Spacing, sizes, and breakpoints when relevant
5. **Reference existing components**: Point to shadcn/ui components when applicable
