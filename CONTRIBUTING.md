# Contributing to AssetFlow

## Project Folder Structure

The project follows a clean MERN architecture, unified into one common structure. We do not use separate module folders per developer.

```
AssetFlow/
├── backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── validators/
│       ├── utils/
│       ├── uploads/
│       ├── app.js
│       └── server.js
├── frontend/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       ├── hooks/
│       ├── context/
│       ├── utils/
│       ├── App.jsx
│       └── main.jsx
├── database/
│   ├── mongodb.md
│   └── sample-data/
├── package.json
└── README.md
```

## Team Responsibilities

### Member 1
- **Models**: User, Department, AssetCategory
- **Controllers**: authController, departmentController, assetCategoryController

### Member 2
- **Models**: Asset, Allocation
- **Controllers**: assetController, allocationController

### Member 3
- **Models**: Booking, Maintenance
- **Controllers**: bookingController, maintenanceController
- **Routes**: bookingRoutes, maintenanceRoutes

### Member 4
- **Models**: Audit, Notification, ActivityLog
- **Controllers**: auditController, notificationController, reportController

## Git Branch Naming Convention

Please use the following branch naming convention for your work:

- `feature/auth`
- `feature/assets`
- `feature/booking-maintenance`
- `feature/audit-reports`

## Commit Message Convention

We follow conventional commits for clear history. Examples:

- `feat: add booking model`
- `feat: create maintenance controller`
- `fix: overlap validation`
- `docs: update README`
