# Task 2 - avatar-crop-agent

## Task: Implement avatar upload with image cropping

### Work Done

1. **Created `/home/z/my-project/src/components/luna/ImageCropDialog.tsx`**
   - Reusable image crop dialog using `react-easy-crop` v6
   - Props: `open`, `imageSrc`, `onCropComplete`, `onCancel`, `cropShape` ('round'|'rect'), `aspectRatio` (default 1)
   - Canvas-based crop output, compressed to max 512x512 JPEG at 85% quality
   - Dark theme styling (#1a2027, #f0ece4, #e07a5f)
   - Zoom slider, confirm/cancel buttons with i18n

2. **Updated `/home/z/my-project/src/components/luna/ProfileEditSheet.tsx`**
   - Removed `handleAvatarUpload` prop (file handling now internal)
   - Added `onFileChange` → opens ImageCropDialog → sets cropped avatar
   - Circular crop for avatar (cropShape='round', aspectRatio=1)
   - File size validation with toast notification
   - Added `useToast` import

3. **Updated `/home/z/my-project/src/app/page.tsx`**
   - Removed `handleAvatarUpload` function
   - Removed `handleAvatarUpload` prop from ProfileEditSheet call

4. **Added i18n keys to `translations.ts`**
   - `crop_confirm`: 确认 / Confirm / 확인
   - `crop_cancel`: 取消 / Cancel / 취소
   - `crop_title`: 裁剪图片 / Crop Image / 이미지 자르기

### Result
- Lint passes, dev server runs correctly
- Avatar upload flow: select file → crop dialog → cropped image set as avatar
