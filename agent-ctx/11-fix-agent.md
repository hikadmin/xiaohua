# Task 11 - Fix 4 Feature Issues for Luna App

## Agent: Main
## Task ID: 11

### Work Summary

Implemented 4 feature fixes for the Luna period tracker app:

1. **Export Data — Web Share API Support**: Replaced simple CSV download with Web Share API that can share to WeChat and other apps. Falls back to download if Web Share API not available. Added `generateCSVFromRecords` helper function for local mode fallback.

2. **Theme Color — Remove Scope Toggle**: Removed the theme scope toggle (local/global) from both page.tsx and ProfileTab.tsx. Theme color now always applies globally via `--theme-color` CSS custom property.

3. **Dark Mode — next-themes Integration**: 
   - Added ThemeProvider from next-themes in layout.tsx
   - Added CSS custom properties (--luna-bg, --luna-card, --luna-surface, --luna-text, --luna-text-secondary, --luna-text-muted, --luna-card-border, --luna-overlay) for both light and dark themes in globals.css
   - Added useTheme sync in page.tsx to connect dark_mode setting with next-themes
   - Updated toggleSetting to immediately apply dark mode changes
   - Updated all major components (page.tsx, ProfileTab, HomeTab, CalendarTab, LogTab) to use CSS variables instead of hardcoded colors

4. **Reminders — Web Notification API**:
   - Added `requestNotificationPermission` and `showNotification` functions in page.tsx
   - Updated notification generation useEffect to check reminder settings and trigger browser notifications
   - Updated ProfileTab reminder toggles to auto-request notification permission when enabling
   - Added permission denied toast feedback

### Files Modified
- `/home/z/my-project/src/app/page.tsx` - Dark mode sync, export CSV with Web Share, notification push, CSS variables
- `/home/z/my-project/src/app/layout.tsx` - ThemeProvider wrapper
- `/home/z/my-project/src/app/globals.css` - Light/dark CSS custom properties
- `/home/z/my-project/src/components/luna/ProfileTab.tsx` - Remove scope toggle, CSS variables, notification permission
- `/home/z/my-project/src/components/luna/HomeTab.tsx` - CSS variables for colors
- `/home/z/my-project/src/components/luna/CalendarTab.tsx` - CSS variables for colors
- `/home/z/my-project/src/components/luna/LogTab.tsx` - CSS variables for colors
- `/home/z/my-project/src/lib/i18n/translations.ts` - New i18n keys

### Lint Status
- Passes with 0 errors, 0 warnings
- Dev server compiles without errors
