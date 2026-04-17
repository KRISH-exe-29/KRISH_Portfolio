# Project Lessons & Workflow Patterns

## UI/UX Patterns
- **Cursor Visibility**: Avoid `mix-blend-screen` (or `mix-blend-lighten`) for custom cursors if the app supports a light theme. These modes render the cursor invisible against white backgrounds. Use `mix-blend-difference` or standard colors with glows for better cross-theme visibility.
- **Leadership Sections**: When showcasing "Soft Skills" or leadership, move away from standard grids. Use **Asymmetric Scattered Layouts** with visual hierarchy (Big vs Medium cards).
- **Impact Storytelling**: Use high-impact, short taglines (e.g., "Not assigned. Initiated.") to immediately reframe the narrative from "participation" to "ownership."
- **Hover Dependency**: Never rely purely on hover for critical information (like captions). Provide **default visible labels** so the core story is clear even without interaction.

## Workflow Orchestration
- **Hierarchy of Design**: Portfolios should feel "designed, not placed." Randomly placing images feels like a gallery; sizing them by importance feels like an curated experience.
- **Professional Phrasing**: Always rewrite technical or colloquial filenames into professional phrases (e.g., "BÜHLER images" → "Industrial Exposure & Hands-on Engineering").
