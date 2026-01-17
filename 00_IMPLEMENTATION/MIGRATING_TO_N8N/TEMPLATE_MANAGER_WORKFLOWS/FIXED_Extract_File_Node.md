# Fixed Extract File Node Code

Replace the code in the "Extract File" node with this:

```javascript
// Extract file and user_id from webhook data
const body = items[0].json.body || {};
const query = items[0].json.query || {};

// Get user_id from body or query
const userId = body.user_id || query.user_id || 'unknown';

// Check if binary data exists
if (!items[0].binary || !items[0].binary.file) {
  throw new Error('No file uploaded. Please provide an Excel file in the "file" field.');
}

// Pass through the binary data
return [{
  json: {
    user_id: userId,
    filename: items[0].binary.file.fileName || 'uploaded_file.xlsx',
    mimeType: items[0].binary.file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  binary: {
    file: items[0].binary.file
  }
}];
```

## Changes Made:
1. Access binary data from `items[0].binary.file` instead of `body.file`
2. Removed the complex file extraction logic
3. Pass binary data through to the next node
4. Extract user_id from body or query parameters

## Next Steps:
1. Open the workflow in n8n
2. Click on "Extract File" node
3. Replace the JavaScript code with the above
4. Save the workflow
5. Test the upload again
