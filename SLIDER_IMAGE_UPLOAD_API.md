# 🖼️ Slider Image Upload API Documentation

## 📋 Overview
The Slider Image Upload API allows administrators to upload images directly through the admin interface. The system converts uploaded images to base64 format and sends them to an external PHP API for processing and storage.

## 🔧 API Endpoints

### Upload New Slider Image
- **Endpoint**: `POST /api/admin/upload-slider-image`
- **Authentication**: Admin token required
- **Content-Type**: `multipart/form-data`

### Update Existing Slider Image
- **Endpoint**: `PUT /api/admin/upload-slider-image/[id]`
- **Authentication**: Admin token required
- **Content-Type**: `multipart/form-data`

## 📝 Request Format

### Form Data Fields
- `title` (string, required) - Title of the slider image
- `description` (string, optional) - Description of the image
- `linkUrl` (string, optional) - URL to redirect when image is clicked
- `isActive` (boolean) - Whether the image is active
- `sortOrder` (number) - Sort order for display
- `image` (file, required) - Image file to upload

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### File Size Limit
- Maximum file size: 5MB

## 🔄 Upload Process

1. **File Selection**: User selects an image file through the admin interface
2. **Base64 Conversion**: The system converts the file to base64 format
3. **PHP API Upload**: Base64 data is sent to the external PHP API
4. **URL Retrieval**: PHP API returns the image URL
5. **Database Storage**: Image URL is saved to the database

## 🌐 Environment Configuration

### Required Environment Variables
Add the following environment variables to your `.env` file:

```env
UPLOAD_IMAGE_API_URL=https://your-domain.com/uploadImage.php
UPLOAD_IMAGE_BASE_URL=https://your-domain.com/uploads/
```

### PHP API Expected Format
The PHP API should accept the following JSON payload:

```json
{
  "image": "base64_encoded_image_data",
  "filename": "slider_1234567890.jpg"
}
```

### PHP API Expected Response
The PHP API should return the following JSON response:

```json
{
  "image_url": "68f92f99f3784.jpeg"
}
```

**Note**: The API returns only the filename. The complete URL is constructed by combining the base upload URL with the filename.

## 🎯 Usage Example

### Frontend (Admin Interface)
```javascript
// File selection triggers handleFileChange
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setFormData({ ...formData, imageFile: file });
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }
};

// Form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  const submitData = new FormData();
  submitData.append('title', formData.title);
  submitData.append('description', formData.description || '');
  submitData.append('linkUrl', formData.linkUrl || '');
  submitData.append('isActive', formData.isActive);
  submitData.append('sortOrder', formData.sortOrder);
  submitData.append('image', formData.imageFile);

  const response = await fetch('/api/admin/upload-slider-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    body: submitData
  });
};
```

### Backend Processing
```javascript
// Convert file to base64
const base64Data = await fileToBase64(file);

// Upload to PHP API
const imageUrl = await uploadImageToPHP(base64Data, filename);

// Save to database
const sliderImage = await prisma.sliderImage.create({
  data: {
    title,
    description,
    imageUrl,
    linkUrl,
    isActive,
    sortOrder
  }
});
```

## 🔒 Security Features

- **Admin Authentication**: All endpoints require valid admin token
- **File Type Validation**: Only image files are allowed
- **File Size Validation**: Maximum 5MB file size limit
- **Input Sanitization**: All inputs are properly validated
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 🚨 Error Handling

### Common Error Responses
- `400 Bad Request`: Missing required fields or invalid file type
- `401 Unauthorized`: Invalid or missing admin token
- `404 Not Found`: Slider image not found (for updates)
- `500 Internal Server Error`: Server or upload API error

### Error Response Format
```json
{
  "error": "Error message description"
}
```

## 🛠️ PHP API Implementation

### Sample PHP API (uploadImage.php)
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

// Decode base64 image
$imageData = base64_decode($base64Image);

// Validate image
$imageInfo = getimagesizefromstring($imageData);
if ($imageInfo === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid image data']);
    exit;
}

// Save image
$uploadDir = 'uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$filePath = $uploadDir . $filename;
if (file_put_contents($filePath, $imageData)) {
    $imageUrl = 'https://your-domain.com/' . $filePath;
    echo json_encode([
        'success' => true,
        'imageUrl' => $imageUrl,
        'message' => 'Image uploaded successfully'
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save image']);
}
?>
```

## 📊 Database Schema

The uploaded image URL is stored in the `slider_images` table:

```sql
CREATE TABLE slider_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500) NOT NULL,
  link_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🎯 Testing

### Test the Upload Functionality
1. Navigate to Admin Panel → Slider Images
2. Click "Add New Image"
3. Fill in the title and select an image file
4. Click "Create"
5. Verify the image appears in the slider images list

### Test File Validation
- Try uploading non-image files (should be rejected)
- Try uploading files larger than 5MB (should be rejected)
- Try uploading without selecting a file (should show error)

## 🚀 Next Steps

1. **Configure Environment**: Set the `UPLOAD_IMAGE_API_URL` environment variable
2. **Deploy PHP API**: Ensure the uploadImage.php API is accessible
3. **Test Upload**: Test the complete upload flow
4. **Monitor Performance**: Monitor upload success rates and response times
5. **Add Image Optimization**: Consider adding automatic image resizing/compression

## 📝 Notes

- Images are converted to base64 before sending to PHP API
- Filenames are generated with timestamps to avoid conflicts
- The system supports both new uploads and updates to existing images
- Image previews are shown in the admin interface before upload
- All uploads require admin authentication

