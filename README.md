# 🎮 OpenClaw Command Center

A web-based task tracker for OpenClaw projects with Google Sheets integration.

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
- ✅ Google Sheets integration ready

## 🔧 Configuration

### Google Sheets Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Sheets API
4. Create API credentials (API Key)
5. Copy `.env.example` to `.env` and add your credentials

### Deployment to Netlify

1. Push code to GitHub
2. Connect repository in Netlify
3. Add environment variables in Netlify dashboard
4. Deploy automatically!

## 📁 Project Structure

```
open-claw-command-center/
├── src/
│   ├── App.jsx         # Main application
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── netlify.toml        # Netlify config
├── vite.config.js      # Vite config
└── package.json        # Dependencies
```

## 🛠️ Tech Stack

- React 18 + Vite
- @tanstack/react-query for data fetching
- Netlify for hosting