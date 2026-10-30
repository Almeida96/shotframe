# Browser checks

Start with `node scripts/build.mjs` and `node scripts/serve.mjs`. Open `http://127.0.0.1:4176`.

1. Open a PNG with known dimensions and some transparent pixels. Confirm the source dimensions and filename.
2. Select Clear, set shadow and radius to 0, and export at 2×. Check the downloaded PNG's dimensions, corner transparency, and source colors.
3. Select a gradient, a square canvas, and a dark window frame. Add a title, then export at 1×. Confirm that the screenshot is centered below the bar and retains its proportions.
4. Open a JPEG and a WebP. Confirm that each replaces the current image.
5. Try an unsupported format and a corrupted image. The previous image should remain available with an error explaining the failure.
6. Open a large image and choose an export that exceeds the limits. Both export buttons should be disabled. Lowering the scale should enable them again when the result fits.
7. Paste an image from the clipboard. Test Copy PNG where browser permissions allow it; confirm that a blocked copy offers Download PNG.
8. Change frame settings, then use Reset. The source image should stay in place. Use sample should replace the source while keeping the settings.
9. Check the layout at 390 and 1280 pixels wide. The page should not scroll horizontally, and all controls should remain reachable by keyboard.
10. Reload the page. It should return to the sample and default settings.
11. Cover a known colored region with a redaction rectangle, including a reverse-direction drag. Export at 0.5× and 2× and inspect the downloaded pixels: the entire selected region must be opaque black, including its boundary pixels.
12. Undo and redo the redaction, then add one using the coordinate fields with the keyboard. Check that the preview and export contain the same areas. Loading another image must clear the previous image's redactions.

For export comparisons, inspect the downloaded file, not just the on-screen preview. The preview is scaled down for display.
