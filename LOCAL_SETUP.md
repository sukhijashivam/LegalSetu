# 🚀 Local Development Setup Guide

This guide will help you run LegalSetu locally on your machine.

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/)
- **npm** or **yarn** package manager

## 🔧 Setup Steps

### 1. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 2. Database Setup

1. **Create a MySQL database:**
   ```sql
   CREATE DATABASE legalsetu;
   ```

2. **The database tables will be created automatically** when you start the server (via `initializeDatabase()` and `initializeAdvocateDatabase()` functions).

### 3. Environment Variables

#### Backend Environment Variables (`server/.env`)

Create a `.env` file in the `server` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=legalsetu
# DB_SSL_CA=path/to/ca-certificate.pem  # Optional, only for remote databases

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google APIs
GOOGLE_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key
LAWYER_API_KEY=your_google_maps_api_key

# AWS S3 Configuration (for file storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name

# Firebase Admin (for server-side Firebase operations)
# You'll need to download the service account JSON from Firebase Console
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

#### Frontend Environment Variables (`.env`)

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000

# Firebase Configuration (get these from Firebase Console)
VITE_FIREBASE_API=your_firebase_api_key
VITE_FIREBASE_AUTH=your-project-id.firebaseapp.com
VITE_FIREBASE_ID=your-project-id
VITE_FIREBASE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_SENDER=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASURE=your_measurement_id

# Google Maps API Key
VITE_LAWYER_API_KEY=your_google_maps_api_key
```

### 4. Get API Keys

#### Google Cloud Platform APIs:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Google Translate API**
   - **Google Generative AI (Gemini) API**
   - **Google Maps JavaScript API**
   - **Google Cloud Text-to-Speech API**
   - **Google Cloud Speech-to-Text API**
4. Create credentials (API Key) and add them to your `.env` files

#### Firebase:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Add a Web App to get your Firebase config
4. Go to Project Settings > Service Accounts to get Admin SDK credentials

#### AWS S3 (Optional for local development):
- You can use local file storage for development
- If you want to use S3, create an AWS account and S3 bucket
- Get your access keys from AWS IAM

### 5. Run the Application

#### Terminal 1 - Start Backend Server:
```bash
cd server
npm run dev
```

The backend will start on **http://localhost:5000**

#### Terminal 2 - Start Frontend Development Server:
```bash
npm run dev
```

The frontend will start on **http://localhost:5173**

## 🌐 Access the Application

Once both servers are running:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health
- **Admin Panel:** http://localhost:5000/admin/advocates

## ✅ Verify Installation

1. Check backend health:
   ```bash
   curl http://localhost:5000/health
   ```

2. Open your browser and navigate to `http://localhost:5173`

3. You should see the LegalSetu homepage

## 🐛 Troubleshooting

### Database Connection Issues
- Make sure MySQL is running: `mysql -u root -p`
- Verify database credentials in `server/.env`
- Check if the database exists: `SHOW DATABASES;`

### Port Already in Use
- Backend (5000): Change `PORT` in `server/.env`
- Frontend (5173): Change port in `vite.config.js` or use `npm run dev -- --port 3000`

### Missing Environment Variables
- Make sure all `.env` files are created in the correct directories
- Restart both servers after adding new environment variables

### CORS Issues
- The backend is configured to allow all origins in development
- If you still see CORS errors, check `server/app.js` CORS configuration

### Firebase Authentication Issues
- Verify all Firebase environment variables are set correctly
- Make sure Firebase project has Authentication enabled
- Check browser console for specific error messages

## 📝 Notes

- The database tables are created automatically on first run
- File uploads will be stored locally in `server/uploads/` if AWS S3 is not configured
- Socket.IO is configured for real-time chat features
- The app uses hot-reload in development mode

## 🔗 Quick Links

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Documentation:** Check `server/app.js` for available endpoints

---

**Happy Coding! 🎉**

