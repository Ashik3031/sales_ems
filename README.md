# Sales Leaderboard - Real-Time Dashboard

A production-ready MERN application with Socket.IO for real-time sales team performance tracking. Features team leaderboards, agent management, celebration popups, and admin notifications.

## 🚀 Features

### Core Functionality
- **Real-time Leaderboard** - Teams displayed as cards, ranked by average activation percentage
- **Agent Management** - Agents within teams sorted by activation percentage  
- **Live Updates** - Socket.IO powered real-time updates across all clients
- **Celebration Popups** - Confetti animations and sounds on new activations
- **Admin Notifications** - Full-screen takeover notifications (text/image/video/audio)
- **Public TV Mode** - No authentication required for display purposes

### User Roles
- **Admin** - Manage all teams/agents, push notifications, system settings
- **Team Leader (TL)** - Update their team's agents using +/- buttons for submissions, activations, points
- **Public/TV** - Read-only leaderboard view with real-time updates and popups

### Technical Features
- **JWT Authentication** with hardcoded demo credentials
- **WebSocket Real-time Communication** via Socket.IO
- **In-memory Data Storage** with MongoDB-ready interfaces  
- **Rate Limiting** on TL update endpoints
- **Responsive Design** with TailwindCSS
- **Sound Management** with persistent mute/unmute settings

## 🛠 Tech Stack

### Frontend
- **React** with Vite for fast development
- **TailwindCSS** for styling and responsive design
- **Wouter** for client-side routing
- **Zustand** for state management
- **TanStack Query** for server state management
- **Socket.IO Client** for real-time updates

### Backend  
- **Node.js** with Express server
- **Socket.IO Server** for WebSocket communication
- **In-memory Storage** (MongoDB-ready with Mongoose schemas)
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-rate-limit** for API protection

## 🚦 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd sales-leaderboard
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.sample .env
   # Edit .env with your preferred settings (defaults work for demo)
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   This starts both frontend (Vite) and backend (Express) concurrently.

4. **Access the Application**
   - **Dashboard**: http://localhost:5000
   - **Login Page**: http://localhost:5000/login
   - **Public TV**: http://localhost:5000?tv=true





## 🏗 Architecture

### Data Models
- **User** - Admin and TL accounts with roles and team assignments
- **Team** - Contains TL reference and aggregated statistics  
- **Agent** - Individual performers with targets and metrics
- **Notification** - Admin-pushed announcements with media support

### Real-time Events (Socket.IO)
- `leaderboard:update` - Team rankings and statistics changed
- `sale:activation` - New activation triggers celebration popup
- `notification:active` - Admin pushed a takeover notification
- `notification:clear` - Clear active notifications

### API Endpoints
- `POST /api/auth/login` - Authentication with demo credentials
- `GET /api/stats/leaderboard` - Public leaderboard data with top stats
- `GET /api/tl/agents` - TL's team agents (authenticated)
- `PATCH /api/tl/agents/:id/increment` - Update agent metrics (rate-limited)
- `POST /api/admin/notifications` - Push takeover notification (admin only)
- `PATCH /api/admin/notifications/clear` - Clear active notifications

## 🎯 Key Features Explained

### Team Ranking Logic
- **Agent Activation %** = (activations / activationTarget) × 100
- **Team Average** = Average of all agents' activation percentages
- **Team Ranking** = Sorted by team average (highest first)
- **Agent Sorting** = Within each team, sorted by activation % (highest first)

### Celebration System
- Triggers only on activation increments (+1 activations)
- Shows agent photo, name, and new activation count
- Confetti animation with configurable duration
- Sound effects with user-controllable mute/unmute
- Broadcasts to all connected clients in real-time

### Notification Takeover
- Admin can push text, image, video, or audio notifications
- Full-screen overlay replaces leaderboard temporarily  
- Auto-dismisses after configured duration
- Manual dismiss option available
- Supports rich media with URL-based content

### Sound Management
- Global sound toggle persisted in localStorage
- Multiple celebration sound effects (randomly selected)
- Volume control and mute functionality
- Respects user preferences across sessions

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development servers (frontend + backend)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking

### Project Structure
