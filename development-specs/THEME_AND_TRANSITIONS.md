# Theme and Transitions Setup

## Overview
This document describes the dark mode theming and page transition setup for the Solana Distribution Markets application.

## Components Added

### 1. Theme System
- **ThemeProvider** (`packages/ui/src/components/theme-provider.tsx`)
  - Wraps the app with next-themes provider
  - Supports system, light, and dark themes
  - Uses `class` attribute for Tailwind CSS compatibility

- **ThemeToggle** (`packages/ui/src/components/ui/theme-toggle.tsx`)
  - Button to toggle between light and dark modes
  - Shows sun/moon icon based on current theme
  - Prevents hydration mismatch with mounted state

### 2. Page Transitions
- **PageTransition** (`packages/ui/src/components/page-transition.tsx`)
  - Smooth fade and slide animations using Motion library
  - Applied to all page content automatically

- **TopLoadingBar** (`packages/ui/src/components/top-loading-bar.tsx`)
  - Progress bar at top of page during navigation
  - Uses the existing Progress component
  - Auto-hides when loading completes

### 3. Loading States
- **PageLoading** (`packages/ui/src/components/page-loading.tsx`)
  - Full-page loading indicator
  - Uses the existing Spinner component
  - Used in `app/loading.tsx` for route transitions

### 4. Animation Components
- **AnimatedCard** (`packages/ui/src/components/animated-card.tsx`)
  - Card wrapper with hover animations
  - Scales and lifts on hover
  - Configurable hover scale

- **FadeIn** (`packages/ui/src/components/fade-in.tsx`)
  - Fade-in animation with directional slide
  - Configurable delay for staggered animations
  - Supports up, down, left, right directions

### 5. Updated Header
- **Header** (`packages/ui/src/components/ui/header.tsx`)
  - Now includes ThemeToggle button
  - Sticky positioning with backdrop blur
  - Proper Link integration for navigation
  - Clean menubar structure

## Usage Examples

### Using AnimatedCard
```tsx
import { AnimatedCard } from "@repo/ui/components/animated-card";
import { CardHeader, CardTitle, CardContent } from "@repo/ui/components/ui/card";

<AnimatedCard>
  <CardHeader>
    <CardTitle>Your Title</CardTitle>
  </CardHeader>
  <CardContent>
    Your content here
  </CardContent>
</AnimatedCard>
```

### Using FadeIn for Staggered Animations
```tsx
import { FadeIn } from "@repo/ui/components/fade-in";

<div>
  <FadeIn delay={0}>
    <h1>First element</h1>
  </FadeIn>
  
  <FadeIn delay={0.1}>
    <p>Second element</p>
  </FadeIn>
  
  <FadeIn delay={0.2} direction="left">
    <div>Third element from left</div>
  </FadeIn>
</div>
```

### Adding Loading State to Buttons
```tsx
import { Button } from "@repo/ui/components/ui/button";
import { Spinner } from "@repo/ui/components/ui/spinner";
import { useState } from "react";

function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <Button disabled={isLoading} onClick={async () => {
      setIsLoading(true);
      await someAsyncAction();
      setIsLoading(false);
    }}>
      {isLoading && <Spinner className="mr-2 h-4 w-4" />}
      {isLoading ? "Loading..." : "Click me"}
    </Button>
  );
}
```

## Configuration

### Layout Integration
The root layout (`apps/web/app/layout.tsx`) now includes:
- ThemeProvider wrapping the entire app
- TopLoadingBar for navigation feedback
- PageTransition for smooth page changes
- `suppressHydrationWarning` on html tag to prevent theme hydration warnings

### CSS Enhancements
Added to `apps/web/app/globals.css`:
- Smooth scrolling behavior
- Font feature settings for better typography
- Font family fallbacks

### Dependencies Added
- `next-themes@0.4.6` - Theme management
- Already had `motion@12.23.22` - Animation library

## Theme Colors
The app uses CSS variables for theming, defined in `globals.css`:
- Light mode: Clean white background with subtle grays
- Dark mode: Dark background with high contrast text
- All shadcn/ui components automatically adapt

## Best Practices

1. **Always wrap interactive cards with AnimatedCard** for better UX
2. **Use FadeIn for content sections** to create visual hierarchy
3. **Add loading states to async buttons** using Spinner
4. **Use the existing Progress component** for multi-step processes
5. **Theme toggle is in the header** - users can switch anytime

## Performance Notes
- Animations use GPU-accelerated transforms (scale, translateY)
- Theme switching is instant with CSS variables
- Page transitions are lightweight (300ms duration)
- Loading bar provides visual feedback without blocking

## Future Enhancements
- Add more animation presets (bounce, slide, etc.)
- Create animated list components
- Add page transition variants (slide, scale, etc.)
- Implement skeleton loaders for data fetching
