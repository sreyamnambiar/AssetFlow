# Enterprise Asset Management System (EAMS)

A modern full-stack Enterprise Asset Management System designed to help organizations efficiently manage assets throughout their lifecycle. The application provides centralized asset tracking, allocation, maintenance, resource booking, audit management, reporting, notifications, and activity monitoring through an intuitive and responsive interface.

---

# Features

## Authentication & Organization Management
- Secure Login & Signup
- Forgot Password
- Organization Setup
- Department Management
- Employee Directory
- Asset Category Management

## Dashboard
- Asset Summary
- Allocation Overview
- Maintenance Statistics
- Booking Insights
- Audit Overview
- Interactive Charts
- Recent Activities

## Asset Management
- Asset Registration
- Asset Directory
- Asset Details
- Asset Search & Filters
- Asset Allocation
- Asset Return
- Asset Transfer
- Asset History

## Resource Booking
- Resource Booking Calendar
- Booking Requests
- Booking Approval Workflow
- Booking History

## Maintenance Management
- Kanban Workflow
- Maintenance Requests
- Technician Assignment
- Status Tracking
- Maintenance History

## Asset Audit
- Audit Cycle Management
- Asset Verification
- Discrepancy Reports
- Audit History
- Audit Closure

## Reports & Analytics
- Asset Utilization
- Maintenance Frequency
- Department Summary
- Idle Assets
- Resource Booking Heatmap
- Assets Near Retirement
- Export Reports (PDF & Excel)

## Notifications
- Notification Center
- Read / Unread Status
- Mark as Read
- Delete Notifications
- Filters
- Pagination

## Activity Logs
- User Activity Tracking
- Module-wise Logs
- Search
- Filters
- Audit Trail

---

# Technology Stack

## Frontend
- React.js
- HTML5
- CSS3
- JavaScript (ES6+)
- Bootstrap / Tailwind CSS (Based on Project)
- Axios

## Backend
- Node.js
- Express.js

## Database
- MongoDB
- Mongoose

## Authentication
- JWT Authentication
- Password Hashing

## Additional Libraries
- Chart.js / Existing Chart Library
- React Router
- Express Middleware

---

# Project Structure

```
project-root/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── config/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── layouts/
│   │   ├── assets/
│   │   └── App.js
│   │
│   └── package.json
│
└── README.md
```

---

# Installation

## Clone Repository
```bash
git clone <repository-url>
```

## Backend Setup
```bash
cd backend
npm install
npm run dev
```

## Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

# Environment Variables

Create a .env file inside the backend directory.

Example:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

# API Modules

## Authentication
- Login
- Signup
- Forgot Password

## Asset Management
- Register Asset
- Update Asset
- Delete Asset
- View Assets

## Allocation
- Allocate Asset
- Return Asset
- Transfer Asset

## Booking
- Book Resource
- Booking History

## Maintenance
- Create Request
- Assign Technician
- Resolve Maintenance

## Audit
- Create Audit Cycle
- Verify Assets
- Close Audit
- Audit History

## Reports
- Asset Utilization
- Department Summary
- Maintenance Analytics
- Heatmap
- Retirement Report

## Notifications
- Read Notifications
- Mark Read
- Delete Notification

## Activity Logs
- View Logs
- Filter Logs

---

# Team Responsibilities

## Member 1
Authentication & Organization
- Login
- Signup
- Dashboard
- Departments
- Employees
- Asset Categories

---

## Member 2
Asset Management
- Asset Registration
- Asset Directory
- Asset Allocation
- Asset Return
- Asset Transfer
- Asset History

---

## Member 3
Booking & Maintenance
- Booking Calendar
- Booking Management
- Maintenance Board
- Maintenance Workflow

---

## Member 4
Audit & Analytics
- Asset Audit
- Reports & Analytics
- Notifications
- Activity Logs

---

# Security Features
- JWT Authentication
- Protected Routes
- Input Validation
- API Validation
- Error Handling
- Secure Password Storage
- Role-Based Access (if applicable)

---

# Future Enhancements
- QR Code Integration
- Barcode Scanning
- Mobile Application
- AI-Based Asset Prediction
- Email Notifications
- SMS Alerts
- Cloud Storage Integration
- Multi-Organization Support

---

# Project Highlights
- Modular Architecture
- RESTful APIs
- Responsive UI
- Reusable Components
- Clean Folder Structure
- Scalable Design
- Production-Ready Code
- Professional Dashboard
- Enterprise-Level Workflow

---

# License

This project is developed for educational and academic purposes.

---

# Acknowledgements

Developed as a collaborative team project using modern web technologies and best software engineering practices.
