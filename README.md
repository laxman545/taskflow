<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/741fe241-27f9-4972-9a94-12b0e5af7f5c

## 🚀 One-Command Setup & Run (Linux / macOS / Windows)

To install all dependencies (both frontend and backend) and start all servers automatically on any computer:

### On Linux / macOS / Git Bash:
```bash
chmod +x start.sh
./start.sh
```

### On Windows (CMD / PowerShell):
Double-click `start.bat` or run in terminal:
```cmd
start.bat
```

---

## 🌐 Running Services
Once launched, the application services will be accessible at:
- **Frontend App:** http://localhost:3000
- **Backend API Server:** http://localhost:5000
- **Shop Counter Dashboard:** http://localhost:3000/#shop-dashboard
- **System Admin Console:** http://localhost:3000/#admin

---

## 🛠️ Manual Installation (Optional)

If you prefer to run services manually:

1. **Install & Run Backend:**
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Install & Run Frontend:**
   ```bash
   npm install
   npm run dev
   ```
