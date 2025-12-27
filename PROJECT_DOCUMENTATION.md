# Ripple 24/7 Admin Dashboard - Project Documentation

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Services](#api-services)
- [Authentication Flow](#authentication-flow)
- [Component Documentation](#component-documentation)
- [State Management](#state-management)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Future Enhancements](#future-enhancements)

---

## 🎯 Project Overview

**Ripple 24/7 Admin Dashboard** is a comprehensive web-based administrative platform for managing and monitoring civic issue reports. The system enables administrators and supervisors to track, manage, and resolve community-reported issues efficiently.

### Purpose
- Centralized management of civic issue reports
- Real-time tracking and status updates
- Geographic visualization of reported issues
- Supervised workflow for issue resolution
- ML-powered verification and classification

### Target Users
- **Administrators**: Full access to all reports and system management
- **Supervisors**: Block-level access for issue assignment and tracking
- **Workers**: Issue resolution and status updates

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  (React 19 + TypeScript + React Router + TailwindCSS)  │
└───────────────────┬─────────────────────────────────────┘
                    │
                    │ HTTPS/REST API
                    │
┌───────────────────▼─────────────────────────────────────┐
│              Authentication Layer                        │
│           (Firebase Auth + Supabase)                    │
└───────────────────┬─────────────────────────────────────┘
                    │
                    │
┌───────────────────▼─────────────────────────────────────┐
│              Backend Services                            │
│  ┌──────────────────┬──────────────────┬──────────────┐│
│  │  Supabase        │  Firebase        │   Storage    ││
│  │  (PostgreSQL)    │  (Firestore)     │   (Buckets)  ││
│  └──────────────────┴──────────────────┴──────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Architecture Layers

1. **Presentation Layer (React Frontend)**
   - Component-based UI
   - Client-side routing
   - State management with React hooks
   - Responsive design with TailwindCSS

2. **Authentication Layer**
   - Firebase Authentication for user management
   - Role-based access control (RBAC)
   - Session management

3. **Data Layer**
   - Supabase (PostgreSQL) for primary data storage
   - Firebase Firestore for real-time features
   - Storage buckets for image uploads

---

## 💻 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI framework |
| TypeScript | 4.9.5 | Type safety |
| React Router DOM | 7.9.1 | Client-side routing |
| TailwindCSS | 3.x | Styling framework |
| React Query | 5.89.0 | Data fetching & caching |

### Backend & Services
| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL database, storage, authentication |
| Firebase | Authentication, Firestore real-time database |
| PostgREST | Auto-generated REST API |

### Development Tools
| Tool | Purpose |
|------|---------|
| React Scripts | Build tooling |
| ESLint | Code linting |
| PostCSS | CSS processing |
| Autoprefixer | CSS vendor prefixing |

---

## 🗄 Database Schema

### Core Tables

#### 1. **user_profiles**
Stores user account information.

```sql
- id (TEXT, Primary Key) - Firebase UID
- full_name (TEXT, NOT NULL)
- email (TEXT, NOT NULL)
- created_at (TIMESTAMP)
```

#### 2. **reports**
Main table for civic issue reports.

```sql
- id (UUID, Primary Key)
- user_id (TEXT, Foreign Key → user_profiles.id)
- title (TEXT, NOT NULL)
- description (TEXT, NOT NULL)
- contact (TEXT)
- location (TEXT, NOT NULL)
- coords (TEXT, NOT NULL)
- timestamp (TEXT, NOT NULL)
- image_url (TEXT, NOT NULL)
- status (TEXT, CHECK: 'Pending', 'In Progress', 'Resolved', 'Rejected')
- resolved_photo (TEXT)
- resolved_class (TEXT)
- resolved_image_url (TEXT)
- resolved_at (TIMESTAMP WITH TIME ZONE)
- likes_count (INTEGER, DEFAULT 0)
- comments_count (INTEGER, DEFAULT 0)
- priority (INTEGER, DEFAULT 1)
- estimated_resolution_time (INTERVAL)
- supervisor_id (UUID)
- worker_name (TEXT)
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE)
```

#### 3. **issues**
Extended issue tracking system.

```sql
- id (UUID, Primary Key)
- report_id (UUID, Foreign Key → reports.id)
- issue_type (TEXT, NOT NULL)
- block_id (UUID, Foreign Key → blocks.id)
- status (TEXT, CHECK: multiple status values)
- priority (INTEGER, DEFAULT 1)
- estimated_resolution_time (INTERVAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**Status Values:**
- REPORTED
- IN_PROGRESS
- ASSIGNED_TO_SUPERVISOR
- ASSIGNED_TO_WORKER
- WORK_COMPLETED
- MANUAL_REVIEW
- RESOLVED

#### 4. **likes**
User engagement tracking.

```sql
- id (UUID, Primary Key)
- report_id (UUID, Foreign Key → reports.id)
- user_id (TEXT, Foreign Key → user_profiles.id)
- created_at (TIMESTAMP WITH TIME ZONE)
- UNIQUE(report_id, user_id)
```

#### 5. **comments**
User comments on reports.

```sql
- id (UUID, Primary Key)
- report_id (UUID, Foreign Key → reports.id)
- user_id (TEXT, Foreign Key → user_profiles.id)
- user_name (TEXT, NOT NULL)
- content (TEXT, NOT NULL)
- created_at (TIMESTAMP WITH TIME ZONE)
```

#### 6. **notifications**
User notification system.

```sql
- id (UUID, Primary Key)
- user_id (TEXT, Foreign Key → user_profiles.id)
- message (TEXT, NOT NULL)
- read (BOOLEAN, DEFAULT FALSE)
- created_at (TIMESTAMP WITH TIME ZONE)
```

#### 7. **blocks**
Geographic/administrative blocks.

```sql
- id (UUID, Primary Key)
- name (TEXT, NOT NULL)
- created_at (TIMESTAMP)
```

#### 8. **users**
Admin and supervisor accounts.

```sql
- id (UUID, Primary Key)
- email (TEXT, UNIQUE, NOT NULL)
- role (TEXT, CHECK: 'ADMIN', 'SUPERVISOR')
- block_id (UUID, Foreign Key → blocks.id)
- created_at (TIMESTAMP)
```

#### 9. **ml_verification**
Machine learning verification results.

```sql
- id (UUID, Primary Key)
- report_id (UUID, Foreign Key → reports.id)
- predicted_class (TEXT)
- confidence (FLOAT)
- verified (BOOLEAN)
- verified_at (TIMESTAMP)
```

#### 10. **issue_assignments**
Issue assignment tracking.

```sql
- id (UUID, Primary Key)
- issue_id (UUID, Foreign Key → issues.id)
- supervisor_id (UUID, Foreign Key → users.id)
- worker_name (TEXT)
- assigned_at (TIMESTAMP)
- completed_at (TIMESTAMP)
```

#### 11. **report_assignments**
Report assignment tracking (legacy).

```sql
- id (UUID, Primary Key)
- report_id (UUID, Foreign Key → reports.id)
- supervisor_email (TEXT)
- worker_name (TEXT)
- assigned_at (TIMESTAMP)
- completed_at (TIMESTAMP)
```

#### 12. **issue_images**
Images associated with issues.

```sql
- id (UUID, Primary Key)
- issue_id (UUID, Foreign Key → issues.id)
- image_url (TEXT, NOT NULL)
- type (TEXT, CHECK: 'REPORTED', 'COMPLETED')
- uploaded_at (TIMESTAMP)
```

### Database Triggers

#### Auto-update Likes Count
```sql
CREATE TRIGGER trigger_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_likes_count();
```

#### Auto-update Comments Count
```sql
CREATE TRIGGER trigger_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_comments_count();
```

### Database Views

#### user_activity_summary
Aggregated view of user activities.

```sql
SELECT 
  up.id AS user_id,
  r.id AS report_id,
  l.id AS like_id,
  c.id AS comment_id
FROM user_profiles up
LEFT JOIN reports r ON r.user_id = up.id
LEFT JOIN likes l ON l.user_id = up.id
LEFT JOIN comments c ON c.user_id = up.id;
```

### Indexes
Optimized for query performance:
- `idx_reports_user_id` - Report lookups by user
- `idx_reports_created_at` - Chronological queries
- `idx_reports_status` - Status filtering
- `idx_likes_report_id` - Like aggregation
- `idx_comments_report_id` - Comment retrieval
- `idx_notifications_user_id` - User notifications

---

## ✨ Features

### 1. **Dashboard**
- Real-time statistics overview
- Total, Pending, In Progress, and Resolved reports count
- Interactive hotspot map visualization
- Quick access to critical metrics

### 2. **Report Management**
- View all civic issue reports
- Filter by status (Pending, In Progress, Resolved, Rejected)
- Search by title or description
- Date range filtering
- Location-based filtering with radius search
- Report status updates
- Image upload for resolved issues
- Like and comment functionality

### 3. **Authentication & Authorization**
- Firebase-based user authentication
- Role-based access control (Admin, Supervisor)
- Protected routes
- Session management
- Email/password login

### 4. **Geographic Features**
- Interactive map with report hotspots
- Coordinate-based report location
- Radius-based location filtering
- Haversine distance calculation

### 5. **Image Management**
- Upload images for new reports
- Upload resolution proof images
- Supabase storage integration
- 50MB file size limit
- Public read access for report images

### 6. **Notifications**
- Real-time notification system
- User-specific notifications
- Read/unread status tracking

### 7. **ML Integration**
- AI-powered issue classification
- Confidence scoring
- Manual verification workflow
- Predicted class tracking

### 8. **Issue Workflow**
- Multi-stage status tracking
- Supervisor and worker assignment
- Priority management
- Estimated resolution time tracking
- Completion verification

---

## 📁 Project Structure

```
Ripple-dashboard/
├── public/                      # Static assets
│   ├── index.html              # Main HTML template
│   └── vite.svg                # Vite logo
│
├── src/                         # Source code
│   ├── components/             # React components
│   │   ├── AppLayout.tsx       # Main layout wrapper
│   │   ├── ConfirmationModal.tsx
│   │   ├── HotspotMap.tsx     # Map visualization
│   │   ├── ImageUploadModal.tsx
│   │   ├── PrivateRoute.tsx   # Route protection
│   │   ├── ReportCard.tsx     # Report display card
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   ├── Toast.tsx          # Notification toasts
│   │   └── TopNav.tsx         # Top navigation bar
│   │
│   ├── context/                # React context providers
│   │   └── AuthContext.tsx    # Authentication state
│   │
│   ├── pages/                  # Page components
│   │   ├── Dashboard.tsx      # Dashboard page
│   │   ├── Login.tsx          # Login page (legacy)
│   │   ├── Reports.tsx        # Reports management
│   │   ├── Settings.tsx       # Settings page
│   │   └── Auth/              # Authentication pages
│   │       ├── Login.tsx      # Modern login
│   │       ├── ResetPassword.tsx
│   │       └── Signup.tsx
│   │
│   ├── services/               # API services
│   │   ├── api.ts             # Generic API utilities
│   │   ├── firestoreService.ts # Firebase Firestore
│   │   └── supabaseService.ts  # Supabase operations
│   │
│   ├── App.tsx                 # Main App component
│   ├── App.css                 # App-specific styles
│   ├── index.tsx               # Entry point
│   ├── index.css               # Global styles
│   ├── firebase.ts             # Firebase configuration
│   ├── supabase.ts             # Supabase configuration
│   └── types.d.ts              # TypeScript type definitions
│
├── build/                       # Production build
│   └── static/                 # Static assets
│
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── eslint.config.js            # ESLint configuration
└── supabase-schema.sql         # Database schema
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Supabase account

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd ripple_frontend/Ripple-dashboard
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the `Ripple-dashboard` directory:
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

4. **Setup Database**
   - Navigate to your Supabase project
   - Go to SQL Editor
   - Run the `supabase-schema.sql` file to create tables and triggers

5. **Configure Firebase**
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Copy configuration to `.env`

6. **Configure Supabase Storage**
   - Create a storage bucket named `reports`
   - Set public access for read operations
   - Maximum file size: 50MB

7. **Start Development Server**
   ```bash
   npm start
   ```
   The app will run on `http://localhost:3000`

8. **Build for Production**
   ```bash
   npm run build
   ```

---

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_FIREBASE_API_KEY` | Firebase API key | `AIza...` |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `project.firebaseapp.com` |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase project ID | `ripple-admin` |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `project.appspot.com` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging ID | `123456789` |
| `REACT_APP_FIREBASE_APP_ID` | Firebase app ID | `1:123:web:abc` |
| `REACT_APP_SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |

---

## 🔌 API Services

### Supabase Service (`supabaseService.ts`)

#### Key Functions

**fetchReportsForDashboard**
```typescript
async function fetchReportsForDashboard({
  userId?: string,
  isAdmin?: boolean
}): Promise<Report[]>
```
Fetches reports based on user role and permissions.

**updateReportStatus**
```typescript
async function updateReportStatus(
  reportId: string,
  status: string
): Promise<void>
```
Updates the status of a report.

**uploadResolvedPhoto**
```typescript
async function uploadResolvedPhoto(
  reportId: string,
  file: File
): Promise<string>
```
Uploads a resolution proof image to Supabase storage.

### Firebase Service (`firestoreService.ts`)

Handles real-time features and authentication integration.

---

## 🔒 Authentication Flow

### Login Process
1. User enters email and password
2. Firebase Authentication validates credentials
3. On success, JWT token is stored in session
4. User role is fetched from Supabase
5. Protected routes are accessible based on role
6. Auth context provides user state globally

### Role-Based Access
- **Admin**: Full access to all features
- **Supervisor**: Block-specific access
- **User**: Limited to own reports

### Protected Routes
```tsx
<PrivateRoute>
  <AppLayout>
    <Dashboard />
  </AppLayout>
</PrivateRoute>
```

---

## 🧩 Component Documentation

### Core Components

#### **AppLayout**
Main layout wrapper with sidebar and top navigation.

**Props**: `children: React.ReactNode`

#### **PrivateRoute**
Route protection based on authentication status.

**Props**: `children: React.ReactNode`

**Behavior**: Redirects to login if not authenticated.

#### **ReportCard**
Displays individual report information.

**Props**:
```typescript
{
  report: Report;
  onStatusChange?: (reportId: string, status: string) => void;
  onResolveImage?: (reportId: string) => void;
}
```

#### **HotspotMap**
Interactive map showing report locations.

**Props**: `reports: Report[]`

**Features**:
- Marker clustering
- Click-to-view report details
- Heatmap visualization

#### **ImageUploadModal**
Modal for uploading resolution images.

**Props**:
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  reportId: string;
}
```

#### **Toast**
Notification system for user feedback.

**Usage**:
```typescript
const { showToast } = useToast();
showToast('Success message', 'success');
```

---

## 📊 State Management

### Authentication State
Managed via `AuthContext` with React Context API.

**Provided Values**:
```typescript
{
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

### Component-Level State
Most components use React hooks (`useState`, `useEffect`) for local state management.

### Data Fetching
React Query (`@tanstack/react-query`) for:
- Caching
- Background updates
- Optimistic updates
- Error handling

---

## 🚢 Deployment

### Build Process
```bash
npm run build
```

Generates optimized production build in `build/` directory.

### Deployment Platforms

#### **Vercel**
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

#### **Netlify**
1. Link repository
2. Build command: `npm run build`
3. Publish directory: `build`
4. Add environment variables

#### **Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Environment Configuration
Ensure all environment variables are configured in the deployment platform.

---

## 🔐 Security Considerations

### Database Security
- Row Level Security (RLS) disabled for Firebase compatibility
- Use Firebase Auth tokens for API requests
- Validate user permissions server-side

### Storage Security
- Public read access for report images
- Authenticated write access only
- File size limits enforced (50MB)

### API Security
- HTTPS only for all requests
- CORS configured for trusted domains
- Rate limiting recommended

### Authentication
- Secure session storage
- Token expiration handling
- Password reset functionality

### Best Practices
1. Never commit `.env` files
2. Rotate API keys regularly
3. Implement request validation
4. Use parameterized queries
5. Sanitize user inputs

---

## 🔮 Future Enhancements

### Planned Features
1. **Real-time Updates**
   - WebSocket integration
   - Live report status changes
   - Instant notifications

2. **Advanced Analytics**
   - Custom dashboards
   - Report trends analysis
   - Performance metrics
   - Export reports (CSV, PDF)

3. **Mobile App**
   - React Native companion app
   - Push notifications
   - Offline support

4. **Enhanced ML Features**
   - Auto-classification improvements
   - Priority prediction
   - Resolution time estimation

5. **Communication System**
   - In-app messaging
   - Email notifications
   - SMS alerts

6. **Workflow Automation**
   - Auto-assignment rules
   - Escalation policies
   - SLA tracking

7. **Multi-language Support**
   - i18n integration
   - Regional customization

8. **Advanced Filtering**
   - Save filter presets
   - Custom views
   - Bulk operations

### Technical Improvements
- Migrate to Vite for faster builds
- Implement server-side rendering (SSR)
- Add comprehensive unit tests
- E2E testing with Playwright
- Performance monitoring
- Error tracking (Sentry)

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Create production build |
| `npm test` | Run test suite |
| `npm run eject` | Eject from Create React App |

---

## 🤝 Contributing

### Development Workflow
1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request
5. Code review
6. Merge to main

### Code Standards
- Follow ESLint configuration
- Use TypeScript types
- Write meaningful commit messages
- Document complex functions

---

## 📞 Support

For issues, questions, or contributions:
- GitHub Issues: [Repository Issues]
- Email: [Support Email]
- Documentation: [Link to docs]

---

## 📄 License

[Specify your license here]

---

## 🙏 Acknowledgments

- React team for the amazing framework
- Supabase for backend services
- Firebase for authentication
- TailwindCSS for styling utilities
- Open source community

---

**Last Updated**: December 27, 2025  
**Version**: 0.1.0  
**Maintainers**: Ripple Development Team
