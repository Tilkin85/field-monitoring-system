# Field Monitoring System

Daily archaeological and paleontological field reporting for ArchaeoPaleo.

Live site: https://Tilkin85.github.io/field-monitoring-system/

## Field workflow

1. Enter the project, monitor, date, work times, hours, and mileage.
2. Use the numbered section links to record observations, geology, conditions, findings, coordinates, map markers, and photos.
3. Add anything else in **Extra notes & export**.
4. Choose **Download completed PDF**. The supplied AP monitoring sheet is page one. Notes, overflow, observation details, photos, and maps follow on supporting pages.
5. Use **Download JSON backup** to keep a machine-readable copy of all entered information. **Start new report** clears the current draft after confirmation.

The current draft saves in this browser on this device. Photos can exceed browser storage limits; the page reports a failed save and asks you to download a backup. Drafts do not sync between devices. Keep downloaded copies before clearing browser data.

## PDF behavior

- `assets/ap-monitoring-sheet.pdf` is an unchanged copy of the supplied **AP MONITORING SHEET.pdf**. Do not replace or redraw it when adjusting the site.
- `report-pdf.js` loads that PDF and places values only in its existing entry spaces. Selected geology options and continuation choices are circled.
- Text that cannot fit legibly is replaced by "See notes" in its field; the complete text is included under its field name on supporting pages.
- Observation descriptions map to fossils, prehistoric, historic, or architectural fields. Observation location, depth, context, and notes go on supporting pages. Other observation types go there too.
- The original sheet prints **NAD 83 CONUS**. The datum detail field is supplemental; the site does not convert GPS coordinates between datums.
- The current map view can be included as a snapshot. All recorded marker coordinates and descriptions are retained, including markers outside the visible map. Numbered markers match the notes-page key.
- If map tiles cannot be captured, the PDF includes a clearly labeled coordinate plot of the markers. With no markers, it states that the map snapshot was unavailable.
- Photos are included on supporting pages; browser-supported formats such as WebP are converted for PDF embedding.
- The PDF export libraries and font are served with the site. React, Babel, Leaflet, and map tiles currently need network access; offline operation is not guaranteed.

## Development and verification

The deployed app is in `index.html`; `app.js` is a legacy, unused implementation. Serve the repository with any local HTTP server rather than opening `index.html` as a file.

Run the dependency-free PDF regression checks with Node 18 or later:

```sh
node --test tests/pdf.test.cjs
```

The checks cover original page content preservation, pagination, overflow, marker fallback, images, and unusually long project headers. For visual verification, export a representative completed form and render it at print resolution. A blank export with maps disabled should render identically to the source sheet.

Third-party licenses are beside the bundled libraries in `vendor/` and the font in `assets/`.
