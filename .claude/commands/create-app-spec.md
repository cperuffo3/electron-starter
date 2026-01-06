# Create App Specification

You are helping the user define their application by creating three sequential specification documents. The user will provide a brief description of the app they want to build.

## User's App Description

$ARGUMENTS

## Instructions

Create the following documents **in order**, asking clarifying questions between each phase to ensure the specifications are accurate and complete.

### Phase 1: Project Brief

First, draft the `.context/PROJECT_BRIEF.md` document. This should include:

1. **Overview**: A clear 2-3 sentence summary of the application
2. **Problem Statement**: What problem does this solve?
3. **Target Users**: Who will use this app?
4. **Input Data**: What data sources, formats, or APIs are involved?
5. **Core User Flow**: The main journey through the app (numbered steps)
6. **Technical Considerations**: External APIs, state management, data persistence, IPC handlers needed
7. **MVP Scope**: Minimum features for a working first version
8. **Future Enhancements**: Ideas for post-MVP features

After drafting, ask the user to review and confirm before proceeding.

### Phase 2: UI/UX Specification

After the Project Brief is approved, draft the `.context/UI_UX_SPEC.md` document. This should include:

1. **Design System**: Framework choices, fonts, theme support, overall style
2. **Screen Layouts**: ASCII diagrams showing the structure of each main screen
3. **Component Inventory**: List of UI components needed (reference shadcn/ui where applicable)
4. **Component States**: Document states for interactive components (hover, active, disabled, loading, error)
5. **Color Tokens**: Define the color palette using CSS variables
6. **Keyboard Shortcuts**: List any keyboard shortcuts the app should support
7. **Animations**: Describe motion and transitions
8. **Error States**: How errors should be displayed
9. **Responsive Behavior**: How the layout adapts to different window sizes

Use ASCII art for all screen layouts. Be specific about spacing, colors, and component choices.

After drafting, ask the user to review and confirm before proceeding.

### Phase 3: Implementation Plan

After the UI/UX Spec is approved, draft the `.context/IMPLEMENTATION_PLAN.md` document. This should include:

1. **Phase Overview**: Break the project into logical phases (Setup, Data Layer, UI, Integration, Polish)
2. **Task Checklists**: Detailed checkboxes for each phase with specific file paths
3. **File Inventory**: Tables listing new files to create and existing files to modify
4. **Dependencies**: Any npm packages or shadcn/ui components to add
5. **Implementation Notes**: Important decisions, constraints, or patterns to follow

Ensure tasks are ordered correctly (dependencies first) and include full file paths.

## Important Guidelines

- **Ask clarifying questions** between phases to ensure accuracy
- **Be specific**: Use exact file paths, component names, and technical details
- **Follow existing patterns**: Reference the project's architecture (oRPC for IPC, TanStack Router, etc.)
- **Use ASCII diagrams** for all layouts in the UI/UX spec
- **Mark nothing as complete** in the implementation plan - all checkboxes should be empty `[ ]`
- **Overwrite the template content** in each file with actual specifications

## Output

After completing all three documents, provide a summary of what was created and suggest the user can begin implementation by following the Implementation Plan.
