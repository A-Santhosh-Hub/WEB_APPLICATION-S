Dynamic Embedded QR Platform

Print Once. Control Forever.

A serverless, single-file platform that generates permanent QR codes with dynamic destinations. Change the target URL, set scan limits, and track analytics without ever reprinting the QR code.

🚀 Core Concept

Standard QR codes are static; once printed, they point to one URL forever. This platform introduces a Logic Layer between the physical QR code and the final destination.

The Flow:

Physical QR Scan → Points to your deployed Dynamic Embedded QR app (e.g., https://your-app.com/?id=qr_123).

Logic Engine → The app loads silently, checks the database for rules (Scan limits, Active link status).

Redirect → The user is instantly forwarded to the current active destination (e.g., google.com).

**Live Demo:**  
🔗 https://qr-code-test-7ec7c.web.app/


✨ Key Features

Dynamic Switching: Change the destination link anytime from the dashboard.

Smart Logic: Set rules like "After 50 scans, auto-switch to Link B".

Multi-Link Support: Add unlimited backup or alternative links for a single QR code.

Real-Time Analytics: Track total scans, device types, and timestamps.

High-Res Downloads: Download 1000x1000px PNGs of your static QR codes.

Single-File Architecture: The entire app (Dashboard + Redirect Server) lives in one index.html file.

🛠️ Setup & Deployment

1. Host the Application

This application is a Single Page Application (SPA) contained within index.html. You can host it for free on:

Firebase Hosting (Recommended)

Netlify / Vercel

GitHub Pages

2. Firebase Configuration

This app requires a Google Firebase project for the backend database.

Go to the Firebase Console.

Create a new project.

Enable Authentication: Go to Build > Authentication > Sign-in method and enable Anonymous.

Create Database: Go to Build > Firestore Database and create a database.

Start in Test Mode for initial setup.

Get Config: Go to Project Settings, scroll to "Your apps", and copy the firebaseConfig object.

Update Code: Open index.html and replace the userProvidedConfig variable with your own keys.

3. Final Step: Domain Link

Once deployed, open your app's dashboard:

Copy your deployed website URL (e.g., https://my-qr-app.web.app).

Paste it into the "Redirect Server / Host URL" field in the dashboard.

Click Save.

This ensures all generated QR codes point to your real server, not a local preview.

📖 Usage Guide

Creating a Campaign

Click New Campaign.

Enter a Project Name.

Add your destination links (Link A, Link B, etc.).

Choose a Mode:

Manual: You switch links yourself via the dashboard.

Scan Limit: The system switches to the next link after X scans.

Testing

Use the Play Button (▶) next to a project to test the redirect logic in your browser without scanning.

Scan the generated QR code with a physical phone to verify the redirect.

🔒 Security Note

By default, Firestore "Test Mode" allows open access for 30 days. Before using this in a production environment, update your Firestore Rules in the Firebase Console to restrict write access:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Allow read/write only if the user is signed in (Anonymous auth handles this)
      allow read, write: if request.auth != null;
    }
  }
}


🏗️ Tech Stack

Frontend: React 18 (via CDN), Tailwind CSS

Backend: Firebase (Firestore, Auth)

Icons: Lucide-React

QR Engine: QR Server API

Developed by SanStudio




![Dynamic QR  Viewer Screenshot](https://github.com/A-Santhosh-Hub/WEB_APPLICATION-S/blob/main/Dynamic%20Embedded%20QR%20Platform/Screenshot%202026-01-13%20172623.png)
