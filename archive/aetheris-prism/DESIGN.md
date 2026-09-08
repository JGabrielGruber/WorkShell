---
name: Aetheris Prism
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3f4850'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#006686'
  on-secondary: '#ffffff'
  secondary-container: '#7ed4fd'
  on-secondary-container: '#005b78'
  tertiary: '#783eb2'
  on-tertiary: '#ffffff'
  tertiary-container: '#9358cd'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#c0e8ff'
  secondary-fixed-dim: '#7bd1fa'
  on-secondary-fixed: '#001e2b'
  on-secondary-fixed-variant: '#004d66'
  tertiary-fixed: '#f0dbff'
  tertiary-fixed-dim: '#ddb8ff'
  on-tertiary-fixed: '#2c0051'
  on-tertiary-fixed-variant: '#62259b'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  grid-margin-desktop: 3rem
  grid-margin-tablet: 2rem
  grid-margin-mobile: 1.25rem
  grid-gutter: 1.5rem
  card-padding-compact: 1.25rem
  card-padding-default: 2rem
  card-padding-spacious: 3rem
  element-gap-xs: 0.375rem
  element-gap-sm: 0.75rem
  element-gap-md: 1rem
  element-gap-lg: 1.5rem
  element-gap-xl: 2.5rem
---

## Brand & Style

This design system embodies pure white glassmorphism, ethereal precision, and architectural lightness. Drawing aesthetic inspiration from floating geometric frosted cubes, transparent crystal blocks, and soft chromatic dispersion, it creates an environment of clarity, quiet luxury, and futuristic serenity.

The target audience comprises forward-thinking digital practitioners, creative technologists, high-end fintech users, and modern enterprise professionals who appreciate uncompromising visual craft, spatial depth, and minimal distraction. The UI evokes a sense of weightlessness, pristine purity, and intellectual calm—transcending flat digital interfaces by introducing optical refraction, specular edge lighting, and hyper-clean geometric order.

Visual pillars:
- **Optical Luminosity:** Translucent frosted acrylic layers, crisp specular perimeter highlights, and ethereal refraction gradients.
- **Architectural Minimalism:** Systematic grid alignments, uncluttered modular containers, and calibrated negative space.
- **Subtle Prismatic Dispersion:** Iridescent chromatic hints restricted strictly to interaction states, specular highlights, and active elements to preserve functional purity.

## Colors

The palette is engineered around pure whites, crystalline atmospheric neutrals, and arctic ice blue tones, enriched by gossamer-thin prismatic violet refractions.

### Atmospheric Foundations & Surfaces
- **Canvas Base:** `#F8FAFC` to `#F1F5F9` — an immaculate, ultra-soft cool-white gradient base simulating diffuse studio lighting.
- **Glass Panel Surface (Primary):** `rgba(255, 255, 255, 0.65)` layered over a dense optical blur (`backdrop-filter: blur(24px) saturate(180%)`).
- **Glass Panel Surface (Elevated):** `rgba(255, 255, 255, 0.85)` with internal light catching borders.
- **Pure Solid Surface:** `#FFFFFF` used sparingly for grounded floating modules.

### Prismatic Accents
- **Icy Core (Primary Accent):** `#0284C7` (Sky 600) — high-precision functional anchor for primary actions, active indicators, and focal data points.
- **Glacial Mist (Secondary Accent):** `#7DD3FC` (Sky 300) — ambient glow fills, subtle selected states, and refracted light passes.
- **Spectral Violet (Tertiary Refraction):** `#C084FC` — used selectively in chromatic aberration gradients, specular edge sheen, and interactive hover shifts.

### Text & Hierarchical Contrast
- **Primary Ink:** `#0F172A` (Slate 900) — deep, balanced contrast delivering crisp legibility on frosted white surfaces.
- **Secondary Ink:** `#475569` (Slate 600) — subordinate copy, structural labels, and metadata.
- **Muted Ink:** `#94A3B8` (Slate 400) — disabled glyphs, timestamps, and placeholder tokens.

### Specular & Prism Edge System
- **Perimeter Highlight:** `1px solid rgba(255, 255, 255, 0.9)` on top and left borders, cascading to `rgba(226, 232, 240, 0.4)` on bottom and right borders, mimicking a directional overhead light source hitting chamfered glass.
- **Prismatic Stroke:** Linear gradient (`135deg, rgba(255,255,255,0.9) 0%, rgba(125,211,252,0.4) 45%, rgba(192,132,252,0.25) 75%, rgba(255,255,255,0.7) 100%`).

## Typography

The typographic hierarchy juxtaposes the geometric precision of **Space Grotesk** with the neutral, hyper-legible rhythm of **Inter**.

- **Display & Headlines (Space Grotesk):** Provides a crisp, technical yet sculptural feel reminiscent of optical laboratory instrumentation and futuristic architecture. Tighter letter spacing on large titles enhances structural cohesion.
- **Body & Paragraphs (Inter):** Ensures flawless read-through and high contrast rendering against translucent and frosted glass backdrops.
- **Labels, Badges, & Metrics (Space Grotesk):** Leverages tracking and capitalisation to emulate laser-etched markings on optical lenses.

## Layout & Spacing

The layout is grounded in a 12-column modular grid with generous whitespace, echoing the crystalline suspension of floating geometric cubes.

### Spatial Principles
- **Atmospheric Isolation:** Containers float above the base layer with open internal breathing room. Cramped elements break the illusion of glass clarity; padding is kept intentional and airy.
- **Modular Cube Rhythms:** Cards, nested sub-modules, and toolbars align to systematic 8px increments (0.5rem base unit).
- **Responsive Adaptations:**
  - **Desktop (1200px+):** 12 columns, 48px margins, 24px gutters. Multi-tier floating glass panels with side-docked glass navigation.
  - **Tablet (768px - 1199px):** 8 columns, 32px margins, 20px gutters. Secondary side-panels collapse into floating action trays.
  - **Mobile (< 768px):** 4 columns, 20px margins, 16px gutters. Deep glass layers collapse to single-depth cards to maximize rendering performance and horizontal screen territory.

## Elevation & Depth

Visual hierarchy is communicated via refraction, backdrop diffusion, and directional illumination rather than traditional dark drop shadows.

### The Glass Layering Architecture
1. **Base Surface (Level 0):** Pure diffuse background with faint, ambient radial light leaks (`radial-gradient(circle at 15% 15%, rgba(125, 211, 252, 0.15) 0%, transparent 50%)`).
2. **Resting Glass Panel (Level 1):**
   - Background: `rgba(255, 255, 255, 0.65)`
   - Backdrop Filter: `blur(20px) saturate(160%)`
   - Border: `1px solid rgba(255, 255, 255, 0.8)`
   - Shadow: `0 8px 32px 0 rgba(148, 163, 184, 0.12), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)`
3. **Elevated & Interactive Cube (Level 2):**
   - Background: `rgba(255, 255, 255, 0.85)`
   - Backdrop Filter: `blur(28px) saturate(180%)`
   - Border: `1px solid rgba(255, 255, 255, 0.95)`
   - Shadow: `0 16px 40px -8px rgba(2, 132, 199, 0.12), 0 6px 16px -4px rgba(148, 163, 184, 0.08), inset 0 1.5px 2px 0 rgba(255, 255, 255, 1)`
4. **Modal & Floating Overlays (Level 3):**
   - Background: `rgba(255, 255, 255, 0.92)`
   - Backdrop Filter: `blur(36px) saturate(200%)`
   - Border: `1px solid rgba(255, 255, 255, 1)`
   - Shadow: `0 24px 60px -12px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8), inset 0 2px 4px 0 rgba(255, 255, 255, 1)`

### Specular Edge Refraction
All prominent cards feature a pseudo-element top-light glare: a subtle horizontal gradient line placed along the top interior border reflecting an overhead pure white light source, tapering softly into the corners.

## Shapes

The design system employs a refined `roundedness: 2` (0.5rem / 8px base, 1rem / 16px for cards, 1.5rem / 24px for modals) setting, balancing the crisp precision of engineered glass blocks with smooth, tactile bevels.

- **Micro Components (Chips, Badges, Segment toggles):** 8px corner radius (`rounded-md`).
- **Standard Controls (Buttons, Inputs, Select fields):** 10px corner radius.
- **Floating Glass Panels & Cards:** 16px to 20px corner radius (`rounded-lg` / `rounded-xl`).
- **Optical Prisms & Highlights:** Internal decorative elements follow chamfered 45-degree angle trims or crisp geometric cube forms to match the architectural reference aesthetic.

## Components

### Buttons
- **Primary Refractive Action:** Filled with an ice-tinted gradient (`linear-gradient(135deg, #0284c7 0%, #0369a1 100%)`), pure white text, inner bevel highlight (`inset 0 1px 0 rgba(255,255,255,0.4)`), and an ambient icy blue drop glow (`0 8px 20px -4px rgba(2, 132, 199, 0.35)`).
- **Secondary Glass Action:** `rgba(255, 255, 255, 0.7)` background, `1px solid rgba(255, 255, 255, 0.9)`, `#0F172A` text. On hover, background shifts to `rgba(255, 255, 255, 0.95)` with a subtle prismatic edge border.
- **Ghost/Tertiary:** Transparent fill, `#475569` text, active click produces an immediate glass flash effect (`rgba(255, 255, 255, 0.5)`).

### Input Fields
- Semi-translucent base `rgba(255, 255, 255, 0.6)` with backdrop blur.
- Inactive border: `1px solid rgba(226, 232, 240, 0.8)`.
- Focused state: `rgba(255, 255, 255, 0.95)` background, border transitions to `#7DD3FC`, backed by a soft glow ring (`0 0 0 4px rgba(125, 211, 252, 0.25)`).
- Labels are rendered in **Space Grotesk** uppercase (10px, letter-spacing: 0.06em, color `#64748B`).

### Cards & Modules
- Multi-tier frosted glass construction featuring the directional specular highlight on the upper edge.
- Optional iridescent hover state: cards subtly elevate (-2px on Y-axis) while the border reveals a faint chromatic cyan/violet refractive gradient.

### Chips & Badges
- Ultra-light frosted pills (`rgba(255, 255, 255, 0.75)`), height 24px, Space Grotesk 11px font.
- Status dots within chips utilize optical gemstone colors: Icy Blue (`#0284C7`), Prismatic Violet (`#C084FC`), or Emerald Clarity (`#10B981`) with soft pulse rings.

### Checkboxes & Radios
- Box/Circle frame: `rgba(255, 255, 255, 0.9)` with `1px solid #CBD5E1`.
- Checked state: `#0284C7` solid fill housing a sharp white checkmark glyph, framed by an icy dispersion halo.

### Specialized Glass Navigation Bar
- A floating header or dock suspended 16px from viewport bounds.
- Backed by `backdrop-blur-2xl` (`blur(32px)`), `rgba(255, 255, 255, 0.7)` fill, encapsulated by a continuous 1px micro-specular border.