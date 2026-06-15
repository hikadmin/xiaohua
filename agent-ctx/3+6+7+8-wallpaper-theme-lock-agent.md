# Task 3+6+7+8 - wallpaper-theme-lock-agent

## Task: Implement wallpaper, WeChat export, theme scope, app lock

### Work Log:
- Added i18n keys for all 4 features to translations.ts (zh/en/ko)
- Task 3: Custom Wallpaper - added wallpaper picker bottom sheet with file input, 5 preset gradients, ImageCropDialog integration (cropShape='rect', aspectRatio=9/16), wallpaper background in page.tsx with dark overlay
- Task 6: WeChat Export Enhancement - tries navigator.share() first, fallback generates branded share image via canvas + copies link
- Task 7: Theme Scope Toggle - added local/global scope toggle in ThemeColorSheet, applies CSS custom property --theme-color to :root when global
- Task 8: App Lock PIN Screen - full-screen lock overlay on launch when app_lock enabled, with PIN pad, shake animation on wrong PIN

### Files Modified:
- `/home/z/my-project/src/lib/i18n/translations.ts` - added 11 new i18n keys per locale
- `/home/z/my-project/src/components/luna/ProfileTab.tsx` - added wallpaper, theme scope, enhanced WeChat share
- `/home/z/my-project/src/app/page.tsx` - added wallpaper state, theme scope state, lock screen, wallpaper background

### Result:
- Lint passes with 0 errors
- Dev server compiles correctly
