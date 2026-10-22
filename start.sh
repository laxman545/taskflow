#!/usr/bin/env bash

# ==========================================================
# TaskFlow / Namaste Print - Automatic Setup & Startup Script
# Works on Linux, macOS, and Windows (Git Bash / WSL / MSYS2)
# ==========================================================

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${CYAN}${BOLD}"
echo "=========================================================="
echo "        NAMASTE PRINT / TASKFLOW - STARTUP"
echo "=========================================================="
echo -e "${NC}"

# 1. Resolve project directory regardless of execution location
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$PROJECT_ROOT"

# Check if we are in outer directory and need to cd into taskflow
if [ ! -f "package.json" ] && [ -d "taskflow" ]; then
  cd taskflow
  PROJECT_ROOT="$(pwd)"
fi

echo -e "${BLUE}📁 Project directory:${NC} $PROJECT_ROOT"

# 2. Check prerequisites (Node.js and npm)
echo -e "\n${YELLOW}🔍 Checking system prerequisites...${NC}"

if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}❌ Error: Node.js is not installed or not in PATH.${NC}"
  echo "Please install Node.js (version 18+ recommended) from https://nodejs.org/"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo -e "${RED}❌ Error: npm is not installed or not in PATH.${NC}"
  echo "Please install npm from https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ Node.js:${NC} $NODE_VERSION"
echo -e "${GREEN}✓ npm:${NC} $NPM_VERSION"

# 3. Install backend dependencies
echo -e "\n${YELLOW}📦 Step 1/2: Installing backend dependencies (server/)...${NC}"
if [ -d "$PROJECT_ROOT/server" ]; then
  cd "$PROJECT_ROOT/server"
  npm install
  cd "$PROJECT_ROOT"
  echo -e "${GREEN}✓ Backend dependencies installed successfully.${NC}"
else
  echo -e "${RED}❌ Error: server directory not found at $PROJECT_ROOT/server${NC}"
  exit 1
fi

# 4. Install frontend dependencies
echo -e "\n${YELLOW}📦 Step 2/2: Installing frontend dependencies (root)...${NC}"
npm install
echo -e "${GREEN}✓ Frontend dependencies installed successfully.${NC}"

# 5. Process management and cleanup traps
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo -e "\n\n${YELLOW}🛑 Shutting down TaskFlow servers...${NC}"
  if [ -n "$BACKEND_PID" ]; then
    echo -e "${BLUE}Stopping backend server (PID $BACKEND_PID)...${NC}"
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    echo -e "${BLUE}Stopping frontend dev server (PID $FRONTEND_PID)...${NC}"
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  echo -e "${GREEN}✓ All servers stopped cleanly.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 6. Start Backend Server
echo -e "\n${CYAN}🚀 Launching backend server on port 5000...${NC}"
cd "$PROJECT_ROOT/server"
npm run dev &
BACKEND_PID=$!
cd "$PROJECT_ROOT"

# Wait briefly for backend initialization
sleep 2

# 7. Start Frontend Server
echo -e "${CYAN}🚀 Launching frontend server on port 3000...${NC}"
npm run dev &
FRONTEND_PID=$!

# 8. Ready Banner
echo -e "\n${GREEN}${BOLD}==========================================================${NC}"
echo -e "${GREEN}${BOLD}   ✓ NAMASTE PRINT / TASKFLOW IS LIVE & READY!${NC}"
echo -e "${GREEN}${BOLD}==========================================================${NC}"
echo -e "  ${BOLD}🌐 Frontend:${NC}    ${CYAN}http://localhost:3000${NC}"
echo -e "  ${BOLD}🔌 Backend API:${NC} ${CYAN}http://localhost:5000${NC}"
echo -e "  ${BOLD}📊 Admin:${NC}       ${CYAN}http://localhost:3000/#admin${NC}"
echo -e "  ${BOLD}🏪 Dashboard:${NC}   ${CYAN}http://localhost:3000/#shop-dashboard${NC}"
echo -e "=========================================================="
echo -e "${YELLOW}Press [Ctrl+C] to stop both frontend and backend.${NC}\n"

# Wait for background processes
wait $BACKEND_PID $FRONTEND_PID
