# 🔧 PHP API Troubleshooting Guide

## 🚨 Current Issue
The PHP API is returning HTML instead of JSON, causing the upload to fail with the error:
```
SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
```

## 🔍 Possible Causes

### 1. **Incorrect API URL**
- The `UPLOAD_IMAGE_API_URL` environment variable might be pointing to the wrong URL
- The URL might be pointing to a webpage instead of the PHP script

### 2. **PHP Script Not Found (404 Error)**
- The PHP file doesn't exist at the specified path
- Server returns a 404 HTML page instead of executing the PHP script

### 3. **PHP Script Has Errors**
- PHP syntax errors or runtime errors
- Server returns an error page instead of JSON

### 4. **Server Configuration Issues**
- PHP is not enabled on the server
- Server doesn't support PHP scripts
- Incorrect file permissions

## 🛠️ Debugging Steps

### Step 1: Check Environment Variable
Make sure your `.env` file has the correct URL:
```env
UPLOAD_IMAGE_API_URL=https://your-domain.com/uploadImage.php
```

### Step 2: Test PHP API Directly
Try accessing the PHP API directly in your browser:
```
https://your-domain.com/uploadImage.php
```

**Expected Results:**
- ✅ **Good**: JSON error message like `{"success": false, "message": "Method not allowed"}`
- ❌ **Bad**: HTML page, 404 error, or blank page

### Step 3: Check Server Logs
Look at your server error logs to see if there are any PHP errors.

### Step 4: Test with cURL
Test the API with a simple cURL command:
```bash
curl -X POST https://your-domain.com/uploadImage.php \
  -H "Content-Type: application/json" \
  -d '{"image":"test","filename":"test.jpg"}'
```

## 🚀 Quick Fix Solutions

### Solution 1: Use the Test PHP API
I've created a test PHP API file (`test-upload-api.php`) that you can use:

1. **Upload the file** to your server
2. **Update your environment variable**:
   ```env
   UPLOAD_IMAGE_API_URL=https://your-domain.com/test-upload-api.php
   ```
3. **Test the upload** again

### Solution 2: Create Your Own PHP API
Create a file called `uploadImage.php` on your server with this content:

```php
<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['image']) || !isset($input['filename'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$base64Image = $input['image'];
$filename = $input['filename'];

// Decode and save image
$imageData = base64_decode($base64Image);
$uploadDir = 'uploads/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$filePath = $uploadDir . $filename;
file_put_contents($filePath, $imageData);

$imageUrl = 'https://your-domain.com/' . $filePath;

echo json_encode([
    'success' => true,
    'imageUrl' => $imageUrl,
    'message' => 'Image uploaded successfully'
]);
?>
```

### Solution 3: Check File Permissions
Make sure the PHP file has the correct permissions:
```bash
chmod 644 uploadImage.php
chmod 755 uploads/
```

## 🔍 Enhanced Debugging

The updated API now includes detailed logging. Check your server console for these logs:

```
Uploading to PHP API: https://your-domain.com/uploadImage.php
Filename: slider_1234567890.jpg
Base64 data length: 123456
PHP API Response Status: 200
PHP API Response Headers: {...}
PHP API Raw Response: {"success":true,"imageUrl":"..."}
```

## 🎯 Common Issues & Solutions

### Issue: "Method not allowed"
**Solution**: Make sure you're sending a POST request and the PHP script handles POST requests.

### Issue: "Missing required fields"
**Solution**: Check that the JSON payload includes both `image` and `filename` fields.

### Issue: "Invalid base64 image data"
**Solution**: The base64 data might be corrupted. Check the file conversion process.

### Issue: "Failed to create uploads directory"
**Solution**: Check file permissions and make sure the server can create directories.

### Issue: "Failed to save image file"
**Solution**: Check write permissions on the uploads directory.

## 🧪 Testing the Fix

1. **Set the environment variable**:
   ```env
   UPLOAD_IMAGE_API_URL=https://your-domain.com/test-upload-api.php
   ```

2. **Restart your Next.js server** to pick up the new environment variable

3. **Try uploading an image** through the admin interface

4. **Check the console logs** for detailed debugging information

## 📞 Need Help?

If you're still having issues, please share:
1. The exact URL you're using for the PHP API
2. What happens when you visit that URL directly in your browser
3. Any error messages from the server logs
4. The console output from the enhanced debugging

The enhanced error handling will now provide much more detailed information about what's going wrong with the PHP API communication.

