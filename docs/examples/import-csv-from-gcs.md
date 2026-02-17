# Import a Fulfillment CSV from Google Cloud Storage into Google Sheets

Use the following Google Apps Script to pull the daily fulfillment CSV from a Google Cloud Storage (GCS) bucket directly into a Google Sheet. This is useful when automation jobs drop a report into Cloud Storage and the operations team wants the latest copy in Sheets without manually uploading files.

## Prerequisites

1. The Google Workspace project that owns the spreadsheet must also have access to the target GCS bucket. In most cases that means sharing the bucket with the spreadsheet's default service account (visible under **Project settings → Service accounts** in Apps Script) and giving it the `Storage Object Viewer` role.
2. In Apps Script open **Services** (left-hand menu) and confirm that **Google Cloud Storage API** is enabled, or deploy the script with a standard OAuth scope that includes `https://www.googleapis.com/auth/devstorage.read_only`.
3. Replace the placeholder bucket, object path, and sheet name in the script below to match your setup.

## Script (`importCsvFromGcs.gs`)

```javascript
/**
 * Downloads a CSV from Google Cloud Storage and overwrites the
 * Fulfillment sheet inside the active spreadsheet.
 */
const GCS_IMPORT_CONFIG = {
  bucket: 'your-gcs-bucket',
  objectPath: 'fulfillment/fulfillment_today.csv',
  sheetName: 'Fulfillment',
};

function importCsvFromGcs() {
  const csv = fetchGcsObjectAsCsv(
    GCS_IMPORT_CONFIG.bucket,
    GCS_IMPORT_CONFIG.objectPath,
  );
  writeCsvToSheet(csv, GCS_IMPORT_CONFIG.sheetName);
}

/**
 * Low-level helper that reads an object out of GCS using the
 * script's OAuth token.
 */
function fetchGcsObjectAsCsv(bucket, objectPath) {
  const url = `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(
    bucket,
  )}/o/${encodeURIComponent(objectPath)}?alt=media`;
  const response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
      Accept: 'text/csv',
    },
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();
  if (status !== 200) {
    throw new Error(
      `Failed to download gs://${bucket}/${objectPath} (HTTP ${status}): ${response
        .getContentText()
        .slice(0, 500)}`,
    );
  }

  return response.getContentText();
}

/**
 * Writes a CSV string into a sheet, creating the sheet if needed.
 */
function writeCsvToSheet(csv, sheetName) {
  const rows = Utilities.parseCsv(csv);
  if (rows.length === 0 || rows[0].length === 0) {
    throw new Error('CSV file is empty or malformed.');
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet =
    spreadsheet.getSheetByName(sheetName) ?? spreadsheet.insertSheet(sheetName);
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * Optional: run manually to log the first few rows without writing to the sheet.
 */
function previewGcsCsv() {
  const csv = fetchGcsObjectAsCsv(
    GCS_IMPORT_CONFIG.bucket,
    GCS_IMPORT_CONFIG.objectPath,
  );
  const rows = Utilities.parseCsv(csv).slice(0, 5);
  Logger.log(rows.map((row) => row.join(', ')).join('\n'));
}
```

## Usage tips

- Add a time-driven trigger in Apps Script to call `importCsvFromGcs` every morning after the export job runs.
- If you need to keep historical snapshots, copy the sheet to a dated tab before overwriting it.
- For large CSVs you can swap `sheet.clearContents()` for `sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearContent()` to preserve formatting while removing only the values.
