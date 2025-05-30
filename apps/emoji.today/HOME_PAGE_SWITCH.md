# Home Page Switching

This app now supports switching between two home page versions:

## Current State (Default)
- **Old Home Page**: Simple, clean design without animations
- **Status**: Currently active by default
- **Purpose**: Stable, proven design for daily use

## Available Alternative
- **New Home Page**: Advanced design with emoji animations, cycling, and sophisticated interactions
- **Status**: Available but hidden
- **Purpose**: Ready for future launch when you want to reveal enhanced features

## How to Switch

### To Enable New Home Page
Add this environment variable to your `.env.local` file:
```
NEXT_PUBLIC_USE_NEW_HOME_PAGE=true
```

### To Keep Old Home Page (Default)
Either don't set the variable, or set it to false:
```
NEXT_PUBLIC_USE_NEW_HOME_PAGE=false
```

## When to Switch
- **Keep old**: For stable daily operations until you're ready to launch
- **Switch to new**: When you want to reveal the enhanced experience to users

## Files Structure
- `src/app/page.tsx` - Main router that switches between versions
- `src/components/OldHomePage.tsx` - Simple, clean home page
- `src/components/NewHomePage.tsx` - Advanced home page with animations

The switch is immediate upon restart/redeploy, so you can flip between them whenever you're ready. 