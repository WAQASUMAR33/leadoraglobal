<?php
// Test PHP API for image upload
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false, 
        'message' => 'Method not allowed. Only POST requests are accepted.'
    ]);
    exit;
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if JSON was parsed successfully
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data: ' . json_last_error_msg());
    }
    
    // Validate required fields
    if (!isset($input['image']) || !isset($input['filename'])) {
        throw new Exception('Missing required fields: image and filename are required');
    }
    
    $base64Image = $input['image'];
    $filename = $input['filename'];
    
    // Validate filename
    if (empty($filename) || !preg_match('/^[a-zA-Z0-9._-]+$/', $filename)) {
        throw new Exception('Invalid filename format');
    }
    
    // Decode base64 image
    $imageData = base64_decode($base64Image);
    
    if ($imageData === false) {
        throw new Exception('Invalid base64 image data');
    }
    
    // Validate image data
    $imageInfo = getimagesizefromstring($imageData);
    if ($imageInfo === false) {
        throw new Exception('Invalid image data - not a valid image file');
    }
    
    // Check image size (max 5MB)
    if (strlen($imageData) > 5 * 1024 * 1024) {
        throw new Exception('Image too large. Maximum size is 5MB');
    }
    
    // Create uploads directory if it doesn't exist
    $uploadDir = 'uploads/';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            throw new Exception('Failed to create uploads directory');
        }
    }
    
    // Generate full file path
    $filePath = $uploadDir . $filename;
    
    // Save image file
    if (file_put_contents($filePath, $imageData) === false) {
        throw new Exception('Failed to save image file');
    }
    
    // Generate image URL (adjust this to match your domain)
    $baseUrl = 'https://your-domain.com'; // Change this to your actual domain
    $imageUrl = $baseUrl . '/' . $filePath;
    
    // Return success response
    echo json_encode([
        'success' => true,
        'imageUrl' => $imageUrl,
        'message' => 'Image uploaded successfully',
        'filename' => $filename,
        'size' => strlen($imageData),
        'imageInfo' => [
            'width' => $imageInfo[0],
            'height' => $imageInfo[1],
            'mime' => $imageInfo['mime']
        ]
    ]);
    
} catch (Exception $e) {
    // Log error for debugging
    error_log('Upload API Error: ' . $e->getMessage());
    
    // Return error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

