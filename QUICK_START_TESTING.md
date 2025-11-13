# Quick Start Testing Guide - Image Refinement Feature

## 🚀 Start the Application

### Option 1: Single Terminal (Recommended)

If you have `npm-run-all` installed:

```bash
cd C:\Users\Lucas\nanobanana
npm run dev
```

This starts both backend and frontend together.

### Option 2: Two Terminals

**Terminal 1 - Backend:**
```bash
cd C:\Users\Lucas\nanobanana\backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd C:\Users\Lucas\nanobanana\frontend
npm run dev
```

## 🌐 Access the App

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the Nano Banana app with "Create from Text" mode.

## ✅ Testing Checklist

### 1. Generate Images

- [ ] Enter a prompt: "a minimalist product ad for a smartphone"
- [ ] Select size: "1024x768"
- [ ] Select style: "modern"
- [ ] Select aspect ratio: "16:9"
- [ ] Click "Generate"
- [ ] Wait for images to load (should show 2-3 generated images)

### 2. Test Image Click Interaction

- [ ] Hover over a generated image
- [ ] Verify "Click for options" tooltip appears
- [ ] Verify image gets darker on hover
- [ ] Click on the image

### 3. Verify Modal Opens

- [ ] Modal should appear with the image
- [ ] Modal shows image dimensions (e.g., "1024x768")
- [ ] Modal shows format (e.g., "png")
- [ ] Two action buttons visible:
  - "📥 Download Image"
  - "✨ Edit This Image"

### 4. Test Download Function

- [ ] Click "Download Image" button
- [ ] Image should download to your Downloads folder
- [ ] Filename should contain timestamp
- [ ] Verify file opens correctly (should be valid image)

### 5. Test Refinement Form

- [ ] Click "Edit This Image" button
- [ ] Modal should change to show refinement form
- [ ] Form should have:
  - Refinement Prompt text area
  - Style dropdown (with options like Modern, Minimalist, etc.)
  - Aspect Ratio dropdown (with 1:1, 4:3, 16:9, 9:16)
  - "Refine Image" button (disabled)
  - "Cancel" button

### 6. Test Form Validation

- [ ] Try clicking "Refine Image" with empty prompt
  - Button should be disabled (grayed out)
- [ ] Type a very long prompt (>1000 characters)
  - "Prompt too long" error should appear
  - Button should be disabled
- [ ] Enter valid prompt: "make the colors more vibrant"
  - "✓ Valid prompt" message should appear
  - Button should be enabled

### 7. Test Refinement Submission

- [ ] Enter refinement prompt: "make the colors more vibrant"
- [ ] Keep style as "default"
- [ ] Click "Refine Image"
- [ ] Loading spinner should appear in button
- [ ] Button text changes to "Refining..."
- [ ] Wait for API response (might take 10-30 seconds)

### 8. Test Refinement Results

If refinement succeeds:
- [ ] Modal changes to show refined images grid
- [ ] Shows 1-4 refined image variations
- [ ] Each image shows dimensions
- [ ] Download button below each refined image
- [ ] "Back" button at bottom
- [ ] Click "Download" on refined image to save
- [ ] Click "Back" to return to original image

### 9. Test Error Handling

If refinement fails:
- [ ] Error message should appear in modal
- [ ] Error message should be readable
- [ ] Form should remain visible
- [ ] Can modify prompt and try again

### 10. Test Modal Navigation

- [ ] Click "Back" button after seeing results
  - Should return to original image view
- [ ] Click "Edit This Image" again
  - Should show fresh refinement form
- [ ] Click X button in modal
  - Modal should close
- [ ] Press Escape key
  - Modal should close
- [ ] Click outside modal (backdrop)
  - Modal should close

## 🔧 Troubleshooting

### Issue: Images not generating
- Check backend is running (should see "Express server running on http://localhost:3001")
- Check frontend console for errors (F12 → Console tab)
- Verify environment variable `NANO_BANANA_API_KEY` is set

### Issue: Modal doesn't appear when clicking image
- Check browser console for JavaScript errors
- Verify clickable area is working (should change cursor to pointer)
- Try refreshing the page

### Issue: Download doesn't work
- Check browser console for errors
- Verify image URL is valid (try opening in new tab)
- Try different browser if issue persists

### Issue: Refinement returns error
- Check backend logs for API errors
- Verify image format is supported (should be PNG/JPEG)
- Try with a different refinement prompt

### Issue: TypeScript or build errors
- Run `npm run build` in frontend directory
- Clear node_modules: `rm -rf node_modules` then `npm install`
- Check for typos in file edits

## 📊 What to Look For

### Success Indicators
- ✅ Smooth animations and transitions
- ✅ Clear loading indicators
- ✅ Helpful error messages
- ✅ Form validation prevents invalid submissions
- ✅ Images load correctly in modal
- ✅ Refined images display properly
- ✅ Downloads save with meaningful filenames
- ✅ Modal closes cleanly

### Performance Goals
- Image modal opens within 100ms
- Refinement request sent within 500ms of click
- Results display within 2-30 seconds (API dependent)

## 📝 Notes

- The feature uses your existing `/api/edit` endpoint for refinement
- Refined images are temporary (not saved to server)
- Modal state is local to CreateMode (no persistence)
- Each refinement creates a new API request

## 🎉 Success Criteria

Feature is working correctly if:
1. Can generate images ✅
2. Can click images to open modal ✅
3. Can download from modal ✅
4. Can refine images ✅
5. Can see refined results ✅
6. Modal closes properly ✅
7. No console errors ✅

---

**Last Updated**: 2025-11-13
**Ready for Testing**: Yes ✅
