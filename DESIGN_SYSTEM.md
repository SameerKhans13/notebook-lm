# Deep Intelligence Theme - NotebookLM RAG Interface

> **"Expert Research Engine"** — A sophisticated Slate & Indigo palette designed for technical professionals and researchers.

---

## 🎨 The Deep Intelligence Palette

This theme is built on a **Slate & Indigo** foundation, deliberately rejecting the "default SaaS" aesthetic in favor of a more sophisticated, engineered feel.

### Core Colors

| Element | Hex | HSL | Purpose |
|---------|-----|-----|---------|
| **Background (Surface 0)** | `#F8FAFC` | 210° 40% 98% | Soft off-white (reduces glare) |
| **Cards/Content (Surface 1)** | `#FFFFFF` | 0° 0% 100% | Pure white for contrast |
| **Sidebar (Surface 2)** | `#0F172A` | 217° 33% 17% | Deep Navy — the "pro" anchor |
| **Primary Action** | `#6366F1` | 226° 86% 61% | Indigo — smarter than blue |
| **Text (Primary)** | `#1E293B` | 215° 16% 18% | Slate 800 — soft black |
| **Success/Healthy** | `#10B981` | 160° 84% 39% | Emerald — clear & sophisticated |
| **Border** | `#E2E8F0` | 210° 17% 95% | Subtle slate divider |
| **Muted Text** | `#64748B` | 215° 13% 44% | Slate 500 — secondary info |

### Why This Palette Solves the Audit Issues

✅ **Low Contrast Ghosting Fixed**: Text is now **Slate 800** (#1E293B) instead of light grey. Status indicators like "Vector Repository" are crisp and visible.

✅ **Medical White Eliminated**: The soft off-white background (#F8FAFC) reduces the clinical feel while maintaining the clean, professional aesthetic.

✅ **Accent Clarity**: Indigo (#6366F1) is used consistently for all primary actions, providing a single, intelligent accent color that feels engineered rather than safe.

✅ **Action Clarity**: The query bar gets a prominent 2px Indigo border on focus with a subtle glow (shadow-indigo-500/20).

✅ **Sidebar Authority**: The Deep Navy sidebar immediately signals "navigation workspace" vs. "content workspace."

---

## 📐 Elevation System (3 Surfaces)

The theme uses a clear **3-surface model** for spatial hierarchy:

```
Surface 0 (Background)  → #F8FAFC  (The Canvas)
Surface 1 (Cards/Input) → #FFFFFF  (Interactive Elements)
Surface 2 (Sidebar)     → #0F172A  (Navigation Anchor)
```

### Shadow Elevation

All shadows are **subtle** to maintain sophistication:

| Level | Shadow | Use Case |
|-------|--------|----------|
| **xs** | `0 1px 2px rgba(0,0,0,0.02)` | Hover state |
| **sm** | `0 1px 3px rgba(0,0,0,0.04)` | Cards, dropdowns |
| **md** | `0 4px 6px rgba(0,0,0,0.08)` | Modals, floating panels |
| **lg** | `0 10px 15px rgba(0,0,0,0.1)` | Sticky headers, focus glow |

---

## 🎯 The Three Hero Elements

### 1. The Query Bar — Your Execution Point

```html
<input 
  type="text" 
  class="query-bar" 
  placeholder="Ask your question..."
/>
```

**Default State:**
- Border: 2px `#CBD5E1` (Slate-300)
- Background: White
- Height: 48px
- Font weight: 500
- Padding: 12px 16px

**Focus State:**
- Border: 2px `#6366F1` (Indigo)
- Shadow: `0 0 12px rgba(99, 102, 241, 0.3)`
- The Indigo glow makes it unmissable

**Why It Works**: When the user is ready to "Execute," there should be zero ambiguity. The Indigo glow makes it clear this is the action center.

### 2. The Primary Button — Solid & Commanding

```html
<button class="btn-primary">Execute Query</button>
```

**Styling:**
- Background: `#4F46E5` (Indigo-600)
- Text: White, 600 weight
- Padding: 12px 24px
- Hover: Darker Indigo (#4338CA)
- Shadow: sm → md on hover
- Focus ring: Indigo with 2px offset

**Previous Problem**: Ghost button blending into background.  
**Current Solution**: Solid, commanding Indigo that demands attention.

### 3. The Sidebar — The Professional Anchor

```html
<nav class="sidebar">
  <div class="sidebar-title">Navigation</div>
  <div class="sidebar-item">Documents</div>
  <div class="sidebar-item sidebar-item-active">Active Item</div>
</nav>
```

**Styling:**
- Background: `#0F172A` (Deep Navy/Slate-900)
- Text: `#E2E8F0` (Light slate) → White on active
- Active indicator: 2px left border in Indigo
- Hover: Bg shifts to `#1E293B`
- Font: 14px, 500 weight

**Benefit**: Immediately establishes a clear "workspace vs. navigation" distinction. The deep navy is visually heavy, establishing authority without being aggressive.

---

## 📦 Component Library

### Buttons

#### Primary (The Hero)
```html
<button class="btn-primary">Primary Action</button>
<button class="btn-primary-lg">Large Primary Action</button>
```
- Indigo background, white text
- Use for main actions (Execute, Save, Submit)

#### Secondary
```html
<button class="btn-secondary">Secondary Action</button>
```
- Light slate background, slate text
- Use for less important actions

#### Ghost (Minimal)
```html
<button class="btn-ghost">Tertiary Action</button>
```
- Transparent, text only
- Use for navigation or helper actions

#### Outline (Bordered)
```html
<button class="btn-outline">Outlined Action</button>
```
- Slate border, slate text
- Use for alternative flows

#### Danger
```html
<button class="btn-danger">Delete / Destructive</button>
```
- Red background, white text
- Use for destructive operations only

### Badges

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-danger">Danger</span>
```

**Colors:**
- Primary: Indigo-100 bg + Indigo-700 text
- Success: Emerald-100 bg + Emerald-700 text
- Warning: Amber-100 bg + Amber-700 text
- Danger: Red-100 bg + Red-700 text

### Status Indicators

```html
<span class="status-indicator status-operational">
  🟢 Operational
</span>
```

**Variants:**
- `status-operational`: Emerald
- `status-degraded`: Amber
- `status-offline`: Slate

### Citation Chips (RAG Critical)

```html
<span class="citation-chip">
  📌 UPSC History - Ancient Empires
</span>
```

**Styling:**
- Background: `#F0F4FF` (Indigo-50)
- Border: 1px `#E0E7FF` (Indigo-100)
- Text: `#4338CA` (Indigo-700)
- Padding: 12px (px-3 py-1.5)
- Font: 14px, 500 weight
- Hover: Brightens + shadow-sm

**Why Inline**: In a research tool, seeing the source next to the claim is critical. Users should never have to scroll to verify a fact.

### Confidence Indicator

```html
<div class="confidence-bar">
  <div class="confidence-bar-fill confidence-high" style="width: 92%"></div>
</div>
```

**Levels:**
- High (>75%): `#10B981` (Emerald)
- Medium (50-75%): `#FBBF24` (Amber)
- Low (<50%): `#F97316` (Orange)
- Height: 6px

### Cards

#### Light Card
```html
<div class="card-light">Content</div>
```

#### Interactive Card
```html
<div class="card-light card-interactive card-hover-lift">
  Hover to lift and see shadow
</div>
```

#### Document Card
```html
<div class="document-card">
  <div class="document-card-title">Document Title</div>
  <div class="document-card-meta">2.3 MB • UPSC History • 48 chunks</div>
</div>
```

### Input Fields

#### Standard Input
```html
<input type="text" class="input-clean" placeholder="Enter text...">
```

#### Large Input (Query Bar)
```html
<input type="text" class="input-lg" placeholder="Ask a question...">
```

**Focus Behavior:**
- Border shifts to Indigo
- Optional ring (ring-indigo-500/30)
- Subtle shadow glow

### Messages

#### User Message
```html
<div class="message-user">
  <div class="message-user-content">
    How did the partition affect UPSC history?
  </div>
</div>
```

#### Assistant Message with Full Context
```html
<div class="message-assistant">
  <div class="message-assistant-content">
    <p>The partition fundamentally reshaped...</p>
    
    <!-- Inline citations -->
    <div class="flex gap-2 mt-3">
      <span class="citation-chip">📌 UPSC History - 1947</span>
      <span class="citation-chip">📌 NCERT Vol. 12</span>
    </div>
    
    <!-- Confidence indicator -->
    <div class="mt-3">
      <div class="text-caption">Confidence</div>
      <div class="confidence-bar">
        <div class="confidence-bar-fill confidence-high" style="width: 88%"></div>
      </div>
    </div>
  </div>
</div>
```

#### Error Message
```html
<div class="message-assistant">
  <div class="message-assistant-content message-error">
    ⚠️ Could not retrieve relevant sources. Try rephrasing.
  </div>
</div>
```

### Source Panel with Grouping

```html
<div class="source-group">
  <div class="source-group-title">📚 UPSC Subjects</div>
  
  <div class="source-item source-item-healthy">
    HISTORY - Ancient India
  </div>
  
  <div class="source-item source-item-active">
    GEOGRAPHY - Climate Zones
  </div>
</div>

<div class="source-group">
  <div class="source-group-title">📄 References</div>
  <!-- More items -->
</div>
```

**Grouping Benefits:**
- Scales far better than flat lists
- Reduces cognitive load
- Makes browsing faster
- Supports context organization

### Skeleton Loaders

```html
<div class="skeleton-paragraph">
  <div class="skeleton-text"></div>
  <div class="skeleton-text"></div>
  <div class="skeleton-text w-4/5"></div>
  
  <div class="flex gap-2 mt-3">
    <div class="skeleton-chip"></div>
    <div class="skeleton-chip"></div>
  </div>
</div>
```

**Why Shape Matters**: Users see the expected content layout immediately. This reduces perceived latency far more than a spinner.

---

## 🏗 Layout Reference

### Sidebar Layout
```
┌────────────────────────────────────────────────┐
│  Deep Navy Sidebar    │  Soft White Content    │
│  (Navigation Anchor)  │  (Workspace)           │
├────────────────────────────────────────────────┤
│  🏠 Documents         │  Header Bar            │
│  ⚙️  Settings         ├────────────────────────┤
│  📚 Collections       │  Document Cards        │
│                       │  ┌──────────────────┐  │
│                       │  │ Card 1  │ Card 2 │  │
│                       │  └──────────────────┘  │
│                       │                        │
│                       │  Chat Area             │
│                       │  ┌──────────────────┐  │
│                       │  │ Messages...      │  │
│                       │  └──────────────────┘  │
│                       │  ┌──────────────────┐  │
│                       │  │ [Query Bar]   ▶  │  │
│                       │  └──────────────────┘  │
└────────────────────────────────────────────────┘
```

---

## 🌟 Typography

### Font Stack
```css
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue"
```

### Type Scale

| Level | Size | Weight | Line-height | Usage |
|-------|------|--------|-------------|-------|
| **H1** | 48px (3rem) | 700 | 1.2 | Page titles |
| **H2** | 36px (2.25rem) | 700 | 1.25 | Section headers |
| **H3** | 24px (1.5rem) | 600 | 1.35 | Subsection headers |
| **Body** | 16px (1rem) | 400 | 1.6 | Main text |
| **Small** | 14px (0.875rem) | 400 | 1.5 | Secondary text |
| **Caption** | 12px (0.75rem) | 400 | 1.5 | Metadata |
| **Label** | 12px (0.75rem) | 600 | 1 | Form labels |

### Text Classes

```html
<!-- Slate 900 (Darkest) -->
<h2 class="text-slate-900">Main Title</h2>

<!-- Slate 800 (Primary text) -->
<p class="text-slate-800">Content paragraph</p>

<!-- Foreground (Same as Slate 800) -->
<p>Default foreground text</p>

<!-- Muted -->
<p class="text-muted">Secondary information</p>

<!-- Caption -->
<p class="text-caption">Metadata and hints</p>

<!-- Label -->
<label class="text-label">Form Label</label>
```

---

## ✨ Animations & Interactions

### Smooth Transitions
All interactive elements use **200ms ease-in-out**:

```css
.transition-smooth {
  transition: all 200ms ease-in-out;
}
```

### Entrance Animation
```keyframes
slideUp:
  from: opacity 0, translateY 10px
  to: opacity 1, translateY 0
  duration: 300ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Skeleton Pulse
```keyframes
pulse:
  0%, 100%: opacity 1
  50%: opacity 0.5
```

### Hover Effects

```html
<!-- Lift on hover with shadow -->
<div class="hover-lift">Lifts up on hover</div>

<!-- Glow on hover (action buttons) -->
<button class="hover-glow">Glows with indigo</button>
```

---

## 🎓 Design Principles

### ✅ DO

- ✅ Use weight (font-weight, shadows) for hierarchy
- ✅ Keep borders **hairline only** (1px)
- ✅ Use Indigo consistently for all primary actions
- ✅ Group related items (source panels by subject)
- ✅ Inline citations in message text
- ✅ Show confidence levels explicitly
- ✅ Use skeleton loaders shaped like content
- ✅ Maintain 16px baseline grid
- ✅ Test for contrast (4.5:1 minimum)
- ✅ Deep Navy sidebar for workspace distinction

### ❌ DON'T

- ❌ Use pure white background (use #F8FAFC)
- ❌ Use multiple accent colors (Indigo only)
- ❌ Apply thick borders (>1px)
- ❌ Create heavy drop shadows
- ❌ Make users scroll to find citations
- ❌ Use light grey for primary text
- ❌ Apply ghost buttons for primary actions
- ❌ Mix other color themes with this one
- ❌ Create "cards-on-cards" layouts

---

## ♿ Accessibility

- **WCAG AA**: All text meets 4.5:1 contrast
- **Focus States**: Blue ring on interactive elements
- **Keyboard Navigation**: Logical tab order
- **Color Blind**: Never relies on color alone
- **Reduced Motion**: Respects `prefers-reduced-motion`

---

## 📋 Quick Reference

### Color Codes
```
Primary Action:    #6366F1 (Indigo)
Sidebar:           #0F172A (Deep Navy)
Text:              #1E293B (Slate 800)
Background:        #F8FAFC (Soft White)
Cards:             #FFFFFF (White)
Success:           #10B981 (Emerald)
Border:            #E2E8F0 (Slate)
```

### Button Reference
```html
<!-- Main action -->
<button class="btn-primary">Execute</button>

<!-- Secondary action -->
<button class="btn-secondary">Cancel</button>

<!-- Minimal action -->
<button class="btn-ghost">Skip</button>

<!-- Outlined -->
<button class="btn-outline">Maybe</button>

<!-- Dangerous -->
<button class="btn-danger">Delete</button>
```

### Spacing Grid
```
2px, 4px, 8px, 12px, 16px, 24px, 32px, 48px
```

Use **16px** as your baseline. All spacing should be multiples of 4px.

---

**Theme**: Deep Intelligence  
**Version**: 1.0  
**Status**: Production Ready  
**WCAG Compliance**: AA ✓  
**Last Updated**: May 7, 2026
