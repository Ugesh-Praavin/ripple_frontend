# Ripple Dashboard - Project Documentation

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Features](#features)
5. [Setup & Installation](#setup--installation)
6. [Environment Variables](#environment-variables)
7. [Architecture](#architecture)
8. [Key Components](#key-components)
9. [Services](#services)
10. [Database Schema](#database-schema)
11. [API Integration](#api-integration)
12. [Authentication & Authorization](#authentication--authorization)
13. [Deployment](#deployment)
14. [Development](#development)

---

## Overview

**Ripple Dashboard** is a community reporting and management system that allows administrators to manage and resolve community-reported issues. The system integrates machine learning for automated issue classification and verification, enabling efficient tracking and resolution of community problems like potholes, broken street lights, garbage overflow, and drainage issues.

### Key Capabilities
- **Report Management**: View, filter, and manage community reports
- **ML-Powered Resolution**: Automated issue classification using machine learning
- **Admin Dashboard**: Comprehensive statistics and quick actions
- **Geographic Visualization**: Hotspot map showing report locations
- **Status Tracking**: Track reports from Pending → In Progress → Resolved
- **Image Verification**: Upload resolution photos with ML verification

---

## Tech Stack

### Frontend
- **React 19.1.1** - UI framework
- **TypeScript 4.9.5** - Type safety
- **React Router DOM 7.9.1** - Client-side routing
- **Tailwind CSS 3.4.15** - Styling
- **Vite** - Build tool (configured but using react-scripts)

### Backend Services
- **Firebase Authentication** - User authentication
- **Firebase Firestore** - User roles and admin management
- **Supabase** - Primary database (PostgreSQL) and file storage
- **ML API** - External service for image classification (`https://ripple-model-dfgk.onrender.com`)

### State Management
- **React Context API** - Authentication state
- **React Query** - Data fetching and caching (configured)

### Testing
- **React Testing Library** - Component testing
- **Jest** - Test runner

---

## Project Structure

```
Ripple-dashboard/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── AppLayout.tsx   # Main layout wrapper
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   ├── TopNav.tsx      # Top navigation bar
│   │   ├── ReportCard.tsx  # Report display card
│   │   ├── HotspotMap.tsx  # Geographic visualization
│   │   ├── ImageUploadModal.tsx  # ML resolution modal
│   │   ├── ConfirmationModal.tsx # Confirmation dialogs
│   │   ├── Toast.tsx       # Toast notifications
│   │   └── PrivateRoute.tsx # Route protection
│   ├── context/            # React Context providers
│   │   └── AuthContext.tsx # Authentication state
│   ├── pages/             # Page components
│   │   ├── Auth/          # Authentication pages
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── ResetPassword.tsx
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── Reports.tsx    # Reports management
│   │   └── Settings.tsx   # Settings page
│   ├── services/          # API and service layers
│   │   ├── api.ts         # ML API integration
│   │   ├── firestoreService.ts  # Firebase Firestore operations
│   │   └── supabaseService.ts   # Supabase operations
│   ├── firebase.ts        # Firebase configuration
│   ├── supabase.ts        # Supabase client
│   ├── types.d.ts         # TypeScript type definitions
│   ├── App.tsx            # Main app component
│   └── index.tsx          # Entry point
├── supabase-schema.sql    # Database schema
├── package.json           # Dependencies
├── tailwind.config.js    # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

---

## Features

### 1. Authentication System
- Firebase-based authentication
- Login, Signup, and Password Reset
- Role-based access control (Admin/User)
- Protected routes with `PrivateRoute` component

### 2. Dashboard
- **Statistics Cards**: Total, Pending, In Progress, and Resolved reports
- **Quick Actions**: Direct links to Reports and Settings
- **Hotspot Map**: Visual representation of report locations

### 3. Reports Management
- **Comprehensive Filtering**:
  - Search by title/description
  - Filter by status (Pending, In Progress, Resolved, Rejected)
  - Date range filtering
  - Location-based filtering (lat/lng with radius)
- **Report Actions**:
  - Update report status
  - Resolve with ML verification
  - Upload resolution photos
- **Real-time Updates**: Reports refresh after status changes

### 4. ML-Powered Resolution
- **Image Classification**: Upload resolution photos for ML verification
- **Predicted Classes**:
  - `BrokenStreetLight` / `NotBrokenStreetLight`
  - `PotHole` / `NoPotHole`
  - `GarbageOverflow` / `GarbageNotOverflow`
  - `DrainageOverFlow`
- **Confidence Scores**: ML predictions include confidence levels
- **Automatic Status Update**: Reports marked as Resolved after ML verification

### 5. Geographic Features
- **Hotspot Map**: Visual map showing report locations
- **Location Filtering**: Filter reports within a radius of coordinates
- **Coordinate Parsing**: Supports both "lat,lng" and JSON formats

---

## Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Authentication enabled
- Supabase project with database and storage configured

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ripple-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory (see [Environment Variables](#environment-variables))

4. **Set up Supabase**
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Create a storage bucket named `reports` for image uploads

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

---

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note**: All environment variables must be prefixed with `REACT_APP_` to be accessible in React.

---

## Architecture

### Authentication Flow
1. User logs in via Firebase Authentication
2. `AuthContext` subscribes to auth state changes
3. On authentication, checks user role in Firestore (`users/{uid}` or `admins/{uid}`)
4. `PrivateRoute` components verify admin status before rendering
5. Unauthorized users are redirected to login

### Data Flow
1. **Reports**: Stored in Supabase `reports` table
2. **User Roles**: Stored in Firebase Firestore (`users` collection or `admins` collection)
3. **Images**: Stored in Supabase Storage bucket `reports`
4. **ML Predictions**: External API call to `https://ripple-model-dfgk.onrender.com/predict`

### Component Hierarchy
```
index.tsx
  └── BrowserRouter
      └── AuthProvider
          └── ToastProvider
              └── Routes
                  ├── /login, /signup, /reset (Public)
                  └── /* (App.tsx)
                      └── PrivateRoute
                          └── AppLayout
                              ├── TopNav
                              ├── Sidebar
                              └── Page Content (Dashboard/Reports/Settings)
```

---

## Key Components

### `AuthContext`
- Manages authentication state
- Provides `user`, `isAdmin`, and `loading` states
- Automatically fetches admin status on auth state change

### `PrivateRoute`
- Protects routes requiring authentication
- Verifies admin status
- Redirects unauthorized users

### `AppLayout`
- Wraps authenticated pages
- Provides consistent layout with TopNav and Sidebar

### `ReportCard`
- Displays individual report information
- Shows status, location, images
- Provides action buttons for status updates

### `ImageUploadModal`
- Handles ML-powered resolution workflow
- Uploads image to ML API
- Updates report status based on ML prediction

### `HotspotMap`
- Visualizes report locations on a map
- Shows geographic distribution of issues

---

## Services

### `api.ts` - ML API Integration
- **`predictIssue(file: File)`**: Sends image to ML API for classification
- **`isResolvedClass(predictedClass: string)`**: Checks if prediction indicates resolution
- **`getClassDescription(predictedClass: string)`**: Returns user-friendly class names

### `supabaseService.ts` - Supabase Operations
- **`fetchReportsForDashboard(params)`**: Fetches reports with optional user/admin filtering
- **`updateReportStatus(reportId, status, ...)`**: Updates report status and resolution data
- **`uploadResolvedPhoto(reportId, file)`**: Uploads resolution photo to Supabase Storage
- **`resolveReportWithML(...)`**: Marks report as resolved with ML verification
- **`markReportAsResolved(...)`**: Safe wrapper for resolving reports
- **`createNotification(userId, message)`**: Creates user notifications (optional)

### `firestoreService.ts` - Firebase Operations
- **`subscribeReports(callback)`**: Real-time subscription to Firestore reports (legacy)
- **`updateReportStatus(...)`**: Updates Firestore report status (legacy)
- **`fetchIsAdmin(uid)`**: Checks if user is admin (checks both `users` and `admins` collections)

---

## Database Schema

### Supabase Tables

#### `reports`
Primary table for community reports.
- `id` (UUID, Primary Key)
- `user_id` (TEXT, Foreign Key → user_profiles)
- `title`, `description`, `contact`
- `location`, `coords` (TEXT format: "lat,lng" or JSON)
- `image_url` (TEXT)
- `status` (ENUM: 'Pending', 'In Progress', 'Resolved', 'Rejected')
- `resolved_photo`, `resolved_image_url` (TEXT)
- `resolved_class` (TEXT) - ML prediction class
- `resolved_at` (TIMESTAMP)
- `likes_count`, `comments_count` (INTEGER, auto-updated)
- `created_at`, `updated_at` (TIMESTAMP)

#### `user_profiles`
User profile information.
- `id` (TEXT, Primary Key - Firebase UID)
- `full_name`, `email`
- `created_at` (TIMESTAMP)

#### `likes`
Report likes/upvotes.
- `id` (UUID, Primary Key)
- `report_id` (UUID, Foreign Key)
- `user_id` (TEXT, Foreign Key)
- `created_at` (TIMESTAMP)
- Unique constraint on (report_id, user_id)

#### `comments`
Report comments.
- `id` (UUID, Primary Key)
- `report_id` (UUID, Foreign Key)
- `user_id` (TEXT, Foreign Key)
- `user_name`, `content`
- `created_at` (TIMESTAMP)

#### `notifications`
User notifications (optional).
- `id` (UUID, Primary Key)
- `user_id` (TEXT, Foreign Key)
- `message` (TEXT)
- `read` (BOOLEAN)
- `created_at` (TIMESTAMP)

### Firebase Firestore Collections

#### `users/{uid}`
User role information.
- `role`: 'admin' or 'user'
- `isAdmin`: boolean (alternative to role field)

#### `admins/{uid}`
Legacy admin collection (backward compatibility).
- Document existence indicates admin status

---

## API Integration

### ML Prediction API

**Endpoint**: `https://ripple-model-dfgk.onrender.com/predict`

**Method**: POST

**Request**:
- Content-Type: `multipart/form-data`
- Body: FormData with `image` field

**Response**:
```json
{
  "predicted_class": "PotHole" | "NoPotHole" | "BrokenStreetLight" | ...,
  "confidence": 0.95
}
```

**Predicted Classes**:
- `BrokenStreetLight` - Broken street light detected
- `NotBrokenStreetLight` - Street light is working (resolved)
- `PotHole` - Pothole detected
- `NoPotHole` - No pothole (resolved)
- `GarbageOverflow` - Garbage overflowing
- `GarbageNotOverflow` - Garbage not overflowing (resolved)
- `DrainageOverFlow` - Drainage overflow detected

---

## Authentication & Authorization

### Authentication
- Uses Firebase Authentication
- Supports email/password authentication
- Password reset functionality

### Authorization
- **Admin Access**: Required for all dashboard routes
- **Role Checking**: 
  1. Checks `users/{uid}` document for `role === 'admin'` or `isAdmin === true`
  2. Falls back to checking `admins/{uid}` collection
- **Route Protection**: `PrivateRoute` component enforces admin access

### Admin Setup
To make a user an admin, add them to Firestore:
```javascript
// Option 1: users collection
db.collection('users').doc(uid).set({
  role: 'admin',
  // or
  isAdmin: true
});

// Option 2: admins collection (legacy)
db.collection('admins').doc(uid).set({});
```

---

## Deployment

### Build Process
```bash
npm run build
```
Creates optimized production build in `build/` directory.

### Environment Setup
Ensure all environment variables are configured in your hosting platform:
- Firebase credentials
- Supabase URL and anon key

### Recommended Hosting
- **Vercel**: Automatic deployments from Git
- **Netlify**: Easy React app deployment
- **Firebase Hosting**: Integrated with Firebase services
- **AWS Amplify**: Full-stack deployment

### Build Output
- Static files in `build/` directory
- Can be served by any static file server
- No server-side rendering required

---

## Development

### Available Scripts

- **`npm start`**: Start development server (port 3000)
- **`npm run build`**: Create production build
- **`npm test`**: Run test suite
- **`npm run eject`**: Eject from Create React App (irreversible)

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Functional components with hooks

### Adding New Features

1. **New Page**:
   - Create component in `src/pages/`
   - Add route in `src/App.tsx`
   - Wrap with `PrivateRoute` if admin-only

2. **New Service**:
   - Add functions to appropriate service file
   - Export from service module
   - Import in components

3. **New Component**:
   - Create in `src/components/`
   - Use TypeScript interfaces for props
   - Style with Tailwind CSS

### Testing
- Tests located alongside components
- Use React Testing Library for component tests
- Run with `npm test`

---

## Troubleshooting

### Common Issues

1. **Firebase not initializing**
   - Check environment variables are set correctly
   - Verify Firebase project configuration
   - Check browser console for errors

2. **Supabase connection errors**
   - Verify Supabase URL and anon key
   - Check network tab for API errors
   - Ensure RLS policies allow access (if enabled)

3. **ML API errors**
   - Verify API endpoint is accessible
   - Check image file format and size
   - Review API response format

4. **Admin access denied**
   - Verify user document in Firestore
   - Check `role` or `isAdmin` field
   - Ensure `admins` collection exists if using legacy method

---

## Future Enhancements

Potential improvements and features:
- Real-time notifications
- Advanced analytics and reporting
- Export functionality (CSV/PDF)
- Bulk operations on reports
- User management interface
- Email notifications
- Mobile app integration
- Advanced ML model training
- Supervisor and worker assignment workflows

---

## License

[Specify your license here]

---

## Support

For issues, questions, or contributions, please contact the development team or open an issue in the repository.

