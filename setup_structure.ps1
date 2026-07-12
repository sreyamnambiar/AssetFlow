$ErrorActionPreference = "Stop"

# Remove the modules directory if it exists
$modulesPath = "backend\src\modules"
if (Test-Path $modulesPath) {
    Remove-Item -Recurse -Force $modulesPath
}

# Define backend folders
$backendFolders = @(
    "backend\src\config",
    "backend\src\controllers",
    "backend\src\middleware",
    "backend\src\models",
    "backend\src\routes",
    "backend\src\services",
    "backend\src\validators",
    "backend\src\utils",
    "backend\src\uploads"
)

# Define frontend folders
$frontendFolders = @(
    "frontend\src\assets",
    "frontend\src\components",
    "frontend\src\layouts",
    "frontend\src\pages",
    "frontend\src\routes",
    "frontend\src\services",
    "frontend\src\hooks",
    "frontend\src\context",
    "frontend\src\utils"
)

# Define database folders
$databaseFolders = @(
    "database\sample-data"
)

# Create directories
foreach ($folder in $backendFolders + $frontendFolders + $databaseFolders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Force -Path $folder | Out-Null
    }
}

# Define files to create with boilerplate comments
$backendFiles = @(
    "backend\src\config\db.js",
    "backend\src\config\env.js",
    
    "backend\src\controllers\authController.js",
    "backend\src\controllers\departmentController.js",
    "backend\src\controllers\assetCategoryController.js",
    "backend\src\controllers\assetController.js",
    "backend\src\controllers\allocationController.js",
    "backend\src\controllers\bookingController.js",
    "backend\src\controllers\maintenanceController.js",
    "backend\src\controllers\auditController.js",
    "backend\src\controllers\notificationController.js",
    "backend\src\controllers\reportController.js",
    
    "backend\src\middleware\authMiddleware.js",
    "backend\src\middleware\roleMiddleware.js",
    "backend\src\middleware\errorMiddleware.js",
    
    "backend\src\models\User.js",
    "backend\src\models\Department.js",
    "backend\src\models\AssetCategory.js",
    "backend\src\models\Asset.js",
    "backend\src\models\Allocation.js",
    "backend\src\models\Booking.js",
    "backend\src\models\Maintenance.js",
    "backend\src\models\Audit.js",
    "backend\src\models\Notification.js",
    "backend\src\models\ActivityLog.js",
    
    "backend\src\routes\authRoutes.js",
    "backend\src\routes\departmentRoutes.js",
    "backend\src\routes\assetCategoryRoutes.js",
    "backend\src\routes\assetRoutes.js",
    "backend\src\routes\allocationRoutes.js",
    "backend\src\routes\bookingRoutes.js",
    "backend\src\routes\maintenanceRoutes.js",
    "backend\src\routes\auditRoutes.js",
    "backend\src\routes\notificationRoutes.js",
    "backend\src\routes\reportRoutes.js",
    
    "backend\src\app.js",
    "backend\src\server.js"
)

$frontendFiles = @(
    "frontend\src\App.jsx",
    "frontend\src\main.jsx"
)

$databaseFiles = @(
    "database\mongodb.md"
)

foreach ($file in $backendFiles + $frontendFiles + $databaseFiles) {
    if (-not (Test-Path $file)) {
        $fileName = Split-Path $file -Leaf
        $comment = if ($file -match '\.jsx?$') { "// Boilerplate for $fileName" } else { "<!-- Boilerplate for $fileName -->" }
        Set-Content -Path $file -Value $comment
    }
}

Write-Host "Project structure created successfully!"
