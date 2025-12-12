<?php
/*************************************************************
 * BBYO DM EMAIL EDITOR — IMAGE UPLOAD ENDPOINT
 * Stores images in year/month subfolders:
 *   img_upload/2025/12/{timestamp-random.ext}
 *************************************************************/

header("Content-Type: application/json");

/* ------------------------------
   1. Validate incoming request
------------------------------ */
$raw = file_get_contents("php://input");
if (!$raw) {
    echo json_encode(["error" => "No input received"]);
    exit;
}

$data = json_decode($raw, true);
if (!$data || !isset($data["data"])) {
    echo json_encode(["error" => "Invalid payload"]);
    exit;
}

$base64 = $data["data"];
$originalName = isset($data["filename"]) ? basename($data["filename"]) : "image";

/* ------------------------------
   2. Validate base64 header
------------------------------ */
if (!preg_match('/^data:(image\/(png|jpeg|jpg|gif));base64,/', $base64, $matches)) {
    echo json_encode(["error" => "Invalid or unsupported image format"]);
    exit;
}

$mimeType = $matches[1];
$ext = strtolower($matches[2]);
if ($ext === "jpg") $ext = "jpeg";

/* ------------------------------
   3. Decode base64
------------------------------ */
$base64raw = substr($base64, strpos($base64, ",") + 1);
$binary = base64_decode($base64raw);

if ($binary === false) {
    echo json_encode(["error" => "Failed to decode base64 image data"]);
    exit;
}

/* ------------------------------
   4. Generate unique filename
------------------------------ */
$timestamp = time();
$random = bin2hex(random_bytes(5)); // 10-char hex
$finalName = "{$timestamp}-{$random}.{$ext}";

/* ------------------------------
   5. Build year/month folder paths
------------------------------ */
$year  = date('Y');
$month = date('m');

$rootDir = __DIR__ . "/";
$uploadDir = $rootDir . "{$year}/{$month}/";

$publicBase = "https://www.bbyosummer.org/sfmc/dm-email-editor/img_upload/{$year}/{$month}/";

/* Create year + month folder structure if needed */
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        echo json_encode(["error" => "Failed to create upload directories"]);
        exit;
    }
}

/* ------------------------------
   6. Save file
------------------------------ */
$fullPath = $uploadDir . $finalName;

if (file_put_contents($fullPath, $binary) === false) {
    echo json_encode(["error" => "Failed to write file to disk"]);
    exit;
}

/* ------------------------------
   7. Respond with final URL
------------------------------ */
echo json_encode([
    "success"  => true,
    "url"      => $publicBase . $finalName,
    "filename" => $finalName,
    "folder"   => "{$year}/{$month}/"
]);

exit;
