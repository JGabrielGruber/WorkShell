---
name: Aetheris OS
colors:
  surface: '#0d1320'
  surface-dim: '#0d1320'
  surface-bright: '#333948'
  surface-container-lowest: '#080e1b'
  surface-container-low: '#161b29'
  surface-container: '#1a1f2d'
  surface-container-high: '#242a38'
  surface-container-highest: '#2f3543'
  on-surface: '#dde2f5'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dde2f5'
  inverse-on-surface: '#2a303f'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#d4bbff'
  on-secondary: '#41008b'
  secondary-container: '#6c04de'
  on-secondary-container: '#d4baff'
  tertiary: '#daffdd'
  on-tertiary: '#003919'
  tertiary-container: '#00f982'
  on-tertiary-container: '#006d35'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#ebdcff'
  secondary-fixed-dim: '#d4bbff'
  on-secondary-fixed: '#270058'
  on-secondary-fixed-variant: '#5d00c2'
  tertiary-fixed: '#61ff97'
  tertiary-fixed-dim: '#00e476'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005227'
  background: '#0d1320'
  on-background: '#dde2f5'
  surface-variant: '#2f3543'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
  tag-mono:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit-2xs: 2px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 12px
  unit-base: 16px
  unit-lg: 20px
  unit-xl: 24px
  unit-2xl: 32px
  unit-3xl: 48px
  taskbar-height: 64px
  window-nav-height: 44px
  window-drag-height: 28px
  kanban-lane-width: 340px
  panel-left-width: 280px
  panel-right-width: 260px
---

## Brand & Style

This design system establishes a high-fidelity desktop workspace operating system that merges tactical productivity with atmospheric spatial computing. The visual language blends hyper-refined glassmorphism, luminous optical caustics, and ethereal neon holographic conduits against an organic backdrop—a sunlit horizon of vivid cobalt sky, soft towering cumulus clouds, and rolling verdant meadows.

The emotional core balances clinical precision and technological serenity. The UI feels weightless, hyper-responsive, and spatially aware. Interfaces never obscure the underlying atmosphere; instead, they refract, filter, and prismatically focus light. Translucent surfaces act as physical panes of polished crystalline glass, utilizing micro-specular rim lighting and diffused ambient chromatic glows to demarcate interactive zones without visual clutter.

Targeted at visionary engineers, product architects, and creative directors running complex project lifecycles, the aesthetic combines the discipline of an enterprise-grade productivity environment with the visceral allure of next-generation operating system concepts.

## Colors

The color architecture is calibrated to float effortlessly over both hyper-saturated natural photography and dense multidimensional workspaces:

- **Primary Cyan Hologram (`#00F0FF`)**: The system's primary kinetic frequency. Used for active focus states, dynamic cursor reticles, glowing kanban swimlane delimiters, primary trigger buttons, and optical focal points.
- **Secondary Ultraviolet (`#8A3FFC`)**: Deep, resonant spectrum anchor. Delivers depth gradients behind translucent sheets, marks nested interactive sub-states, and powers secondary thread badges.
- **Tertiary Matrix Mint (`#00FF85`)**: Used for real-time status diagnostics, successful synchronization pulses, collaborator presence nodes, and active attachment indicators.
- **Neutral Deep Space Navy (`#0B111E`)**: Serves as the structural substrate. It provides deep, tinted contrast behind frosted glass panels, ensuring text legibility over unpredictable scenic wallpapers.

### Surface Tints & Light Gradients
- **Glass Base**: `rgba(11, 17, 30, 0.65)` with dynamic hardware blur.
- **Glass High-Reflectance**: `rgba(255, 255, 255, 0.08)` fill with `rgba(255, 255, 255, 0.22)` inner linear gradient strokes.
- **Surface Elevation High**: `rgba(18, 26, 44, 0.78)`.
- **Text Primary**: `#FFFFFF` (100% luminance).
- **Text Muted/Secondary**: `rgba(224, 235, 255, 0.62)`.
- **Holographic Flare**: Multi-stop radial gradients from `rgba(0, 240, 255, 0.28)` bleeding to `rgba(138, 63, 252, 0.0)`.

## Typography

The typographic hierarchy is split across three functional registers:
1. **Space Grotesk (Structural & Display)**: Provides architectural clarity with its idiosyncratic geometric turns and technological edge. Applied to window titles, navigation paths, kanban column headers, and primary operational indicators.
2. **Plus Jakarta Sans (Syntactic & Conversational)**: An ultra-legible humanist-geometric hybrid. Chosen for chat discussions, document bodies, nested metadata, and attachment summaries, maintaining high clarity across varying blurred transparency layers.
3. **JetBrains Mono (System & Data Telemetry)**: Ensures immediate data parsing for file extensions, execution timestamps, presence metadata, code snippets, window dimensions, and technical task IDs.

Always enforce crisp rendering via subpixel anti-aliasing. Apply text drop-shadows (`0 1px 2px rgba(0, 0, 0, 0.45)`) to light text resting directly on low-opacity glass substrates to prevent contrast loss against dynamic daylight elements in the wallpaper.

## Layout & Spacing

The workspace operates as a true spatial canvas with an absolute desktop viewport:
- **Spatial Screen Canvas**: Root full-bleed environment anchored with fixed safe margins (`unit-base` to `unit-xl`) from desktop edges.
- **Docked Bottom Taskbar**: Persistent anchor floating 12px above screen bottom, height of 64px, containing launcher controls, active running threads, workspace switchers, and time/system telemetry.
- **Virtual Projected Kanban Lanes**: Fluid vertical swimlanes (default 340px width) that sit on a horizontal scroll track with snap-points. Swimlanes incorporate an invisible top gutter allowing background scene visibility, connected via neon thread tracks.
- **Three-Column Window Architecture**: Advanced modals use a constrained 3-column split:
  - *Left (Chat Thread)*: Fixed 280px width, vertical scrolling with auto-stick bottom.
  - *Center (Viewer/Previewer)*: Fluid flex (`flex: 1 1 auto`, min 420px), reactive viewport resizing.
  - *Right (Attachment Manifest)*: Fixed 260px width, collapsable to 48px icon-rail mode.
  - *Top Header Zone*: Fixed dual-tier stack—upper 28px draggable bar with native controls, lower 44px navigation bar with omnibox search, path breadcrumbs, and history steppers.

## Elevation & Depth

Visual depth is achieved through layered optical refraction and luminous emission rather than traditional drop shadows:

- **Desktop Substrate (Level 0)**: Unaltered desktop background (vibrant blue sky and lush meadow) overlayed with a global CSS screen ambient tint `rgba(5, 10, 20, 0.2)` to standardize white balance.
- **Background Holographic Grid / Kanban Lanes (Level 1)**: `backdrop-filter: blur(16px) saturate(160%)`. Background fill: `rgba(11, 17, 30, 0.45)`. Perimeter stroke: 1px solid `rgba(255, 255, 255, 0.08)`. Subtle bottom glow: `0 8px 32px -4px rgba(0, 240, 255, 0.08)`.
- **Kanban Cards & Dock Surface (Level 2)**: `backdrop-filter: blur(28px) saturate(190%) brightness(110%)`. Background fill: `rgba(18, 26, 44, 0.65)`. Upper edge highlight: 1px inset border `rgba(255, 255, 255, 0.22)`. Outer soft shadow: `0 16px 40px rgba(0, 0, 0, 0.35)`.
- **Active Multifaceted Modals (Level 3)**: `backdrop-filter: blur(40px) saturate(210%) contrast(105%)`. Shell fill: `rgba(9, 14, 26, 0.82)`. Border: 1px solid `rgba(0, 240, 255, 0.35)`. Specular glow: Outer `0 24px 64px -12px rgba(0, 0, 0, 0.65)`, with inner caustic illumination along top corners.
- **Flyouts, Tooltips & Neon Overlays (Level 4)**: `backdrop-filter: blur(50px)`. High opacity `rgba(2, 6, 15, 0.94)` with hyper-saturated outer radiance (`0 0 16px rgba(0, 240, 255, 0.5)`).

## Shapes

The design system standardizes on Rounded Level 2 geometry, yielding sophisticated architectural proportions:
- **Desktop Taskbar & Modal Shells**: Curvature of 16px to 24px (`rounded-xl` / `rounded-2xl`), imparting the tactile feel of smooth polished lens disks.
- **Kanban Task Cards & Viewer Containers**: Curvature of 12px to 14px (`rounded-lg`), cleanly housing dense typography without clipping corner content.
- **Interactive Buttons, Chips, and Participant Tags**: Curvature of 6px to 8px (`rounded-sm` / `rounded-md`), preventing visual conflict with outer cards.
- **System Window Controls**: Perfect circles (12px diameter) with glowing core centers on hover.

## Components

### 1. Multifaceted Window Modal
- **Window Drag Bar**: 28px height; runs full window width. Contains left-aligned traffic-light circles (Close `#FF5F56`, Minimize `#FFBD2E`, Maximize `#27C93F` with internal translucent glow). Right section houses the Float/Pin toggle button that switches between locked canvas coordinates and free-floating absolute positioning with subtle cyan pin lighting.
- **Navigation Breadcrumb Bar**: 44px height; contains backward/forward chevron history buttons, interactive breadcrumbs (`Workspace / Sprint 24 / Task-882`), and a central glass Omnisearch input with keyboard shortcut badges (`⌘K`).
- **Left Column (Chat Thread)**: Glass divider with right border (`1px solid rgba(255,255,255,0.06)`). Each message features colored participant tags (e.g., Violet for Product, Mint for Engineering, Amber for Design) formatted in JetBrains Mono. Translucent speech bubbles with left-border participant accent stripes.
- **Central Pane (Interactive Previewer)**: Darkened canvas inset with high blur. Features context-aware inspection tools, zoom controllers, pan grips, and holographic overlay pins for point-in-time threaded annotations.
- **Right Column (Attachment Manifest)**: Categorized file stack (Figma embeds, PR diffs, 3D assets, MP4 screen recordings). Items display miniature glass preview thumbnails, file weight chips, and holographic synchronization status bars.

### 2. Digital Projected Kanban Lanes
- **Lanes**: Semi-transparent vertical monoliths. Top header features lane titles in Space Grotesk, ticket count badges with neon cyan glow, and an omnidirectional quick-add (+) icon.
- **Cards**: Translucent frosted panels that emit an optical rim glow on hover. Displays task title, dynamic priority pills, assignee micro-avatars stacked with 2px glass borders, and attachment counters. When dragging, cards cast an elevated ultraviolet shadow and increase surface blur to 36px.

### 3. Desktop Taskbar (Bottom Dock)
- Positioned floating 12px off the bottom desktop edge, centered with dynamic auto-width.
- Houses app launcher, minimized thread tabs with pulsing real-time mention badges, system volume/wifi glass sliders, and a JetBrains Mono digital clock showing micro-telemetry.
- Active items project a subtle 12px cyan laser tick under their corresponding icon.

### 4. Interactive Glass Buttons & Inputs
- **Primary Action Button**: Linear gradient from `rgba(0, 240, 255, 0.2)` to `rgba(138, 63, 252, 0.2)` with a 1px perimeter border of solid `#00F0FF`. Text rendered in Space Grotesk with subtle outer glow.
- **Ghost/Secondary Button**: `rgba(255, 255, 255, 0.05)` fill, `rgba(255, 255, 255, 0.15)` border; scales up 1.02x with `rgba(255, 255, 255, 0.12)` fill on hover.
- **Text Inputs & Search Fields**: Recessed glass styling with inset shadow (`inset 0 2px 4px rgba(0,0,0,0.5)`), background `rgba(5, 8, 16, 0.6)`. Active focus triggers an expanding holographic focus ring (`0 0 0 2px rgba(0, 240, 255, 0.4)`).