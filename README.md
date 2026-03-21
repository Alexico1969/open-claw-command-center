# 🎮 OpenClaw Command Center

A web-based task tracker for OpenClaw projects with Firebase backend, Notion integration, and automatic task processing.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (http://localhost:4000)
npm run dev
```

## 📋 Features

- ✅ Task management (add, complete, delete)
- ✅ Filter tasks (All, Active, Completed)
- ✅ Statistics dashboard
- ✅ Firebase Firestore for real-time data
- ✅ Password protection
- ✅ Automatic task processing (weather, Notion)
- ✅ **Cloud Functions** for backend automation

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Firebase (already configured)
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=openclaw-command-center-db

# Notion
VITE_NOTION_API_KEY=ntn_your_key
VITE_NOTION_PAGE_ID=your_page_id

# Password Protection
PASSWORD=BruceWayne123!
```

### Deployment to Netlify

1. Push code to GitHub
2. Connect repository in Netlify
3. Add environment variables in Netlify dashboard
4. Deploy automatically!

## ☁️ Firebase Cloud Functions

The project includes Firebase Cloud Functions that automatically process tasks when they're created.

### What They Do

1. **Trigger on new task**: Automatically runs when you add a task
2. **Process weather tasks**: Fetches weather data and sends to Notion
3. **Process Notion tasks**: Sends content to Notion automatically
4. **Send webhook notifications**: Optionally notify external services
5. **Log actions**: All actions are logged to Firestore

### Deploy Cloud Functions

```bash
# Install Firebase CLI globally (if not already)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set environment variables
firebase functions:config:set notion.api_key="your_key" notion.page_id="your_id"
# Or use .env file
firebase functions:config:set \
  notion.api_key="$(grep NOTION_API_KEY .env | cut -d '=' -f2)" \
  notion.page_id="$(grep NOTION_PAGE_ID .env | cut -d '=' -f2)"

# Deploy only the functions
firebase deploy --only functions
```

### Optional: Webhook Notifications

To receive notifications when tasks are created, set a webhook URL:

```bash
firebase functions:config:set webhook.url="https://your-webhook.com/notify"
```

### Cloud Function Environment Variables

The functions read from `functions.config`:

- `notion.api_key` - Notion API key
- `notion.page_id` - Notion page ID
- `webhook.url` - Optional webhook for notifications

## 📁 Project Structure

```
open-claw-command-center/
├── src/
│   ├── App.jsx         # Main application
│   ├── main.jsx        # Entry point
│   ├── firebase.js    # Firebase config
│   └── index.css      # Global styles
├── functions/          # Firebase Cloud Functions
│   ├── index.js       # Function code
│   └── package.json   # Dependencies
├── netlify.toml        # Netlify config
├── firebase.json       # Firebase config
├── .firebaserc        # Firebase project
├── vite.config.js      # Vite config
└── package.json        # Dependencies
```

## 🛠️ Tech Stack

- React 18 + Vite
- Firebase Firestore for real-time database
- Firebase Cloud Functions for backend automation
- Netlify for hosting
