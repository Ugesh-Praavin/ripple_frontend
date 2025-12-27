# Ripple Dashboard

A comprehensive admin dashboard for managing community reports with ML-powered issue classification and resolution tracking.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
# Copy .env.example to .env and fill in your credentials

# Start development server
npm start
```

## Features

- 🔐 **Firebase Authentication** - Secure admin access
- 📊 **Dashboard Analytics** - Real-time statistics and insights
- 🗺️ **Geographic Visualization** - Hotspot map of reported issues
- 🤖 **ML-Powered Resolution** - Automated issue classification
- 📝 **Report Management** - Filter, search, and manage community reports
- 🖼️ **Image Verification** - Upload and verify resolution photos

## Documentation

For complete documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md)

The documentation includes:
- Detailed setup instructions
- Architecture overview
- API reference
- Database schema
- Component documentation
- Troubleshooting guide

## Tech Stack

- **React 19** + **TypeScript**
- **Firebase** (Authentication)
- **Supabase** (Database & Storage)
- **Tailwind CSS** (Styling)
- **React Router** (Routing)

## Environment Variables

Required environment variables:
- `REACT_APP_FIREBASE_*` - Firebase configuration
- `REACT_APP_SUPABASE_URL` - Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key

See [DOCUMENTATION.md](./DOCUMENTATION.md#environment-variables) for details.

## License

[Your License Here]
