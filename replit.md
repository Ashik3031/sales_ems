# Sales Leaderboard - Real-Time Dashboard

## Overview

This is a production-ready MERN application that provides real-time sales team performance tracking through a dynamic leaderboard system. The application displays teams as cards ranked by average activation percentage, with agents within each team sorted by their individual activation rates. It features live updates via WebSocket communication, celebration animations for new activations, and admin notification capabilities for company-wide announcements.

The system supports three primary user roles: Admins who manage the entire system and push notifications, Team Leaders (TLs) who update their team's agent metrics, and a public TV mode for read-only leaderboard viewing. The application emphasizes real-time collaboration and visual feedback to enhance sales team motivation and performance tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with Vite**: Modern development setup with fast hot module replacement and optimized builds
- **Component Library**: Utilizes Radix UI primitives with shadcn/ui components for consistent, accessible UI elements
- **Styling**: TailwindCSS with CSS custom properties for theming, responsive design patterns
- **Routing**: Wouter for lightweight client-side routing with role-based route protection
- **State Management**: 
  - Zustand for client-side state (auth, audio settings, leaderboard data, notifications)
  - TanStack Query for server state management and caching
  - Persistent storage for user preferences (audio settings, authentication tokens)

### Backend Architecture
- **Express.js Server**: RESTful API endpoints with middleware for authentication, rate limiting, and error handling
- **In-Memory Data Storage**: Current implementation uses in-memory storage with interfaces designed for easy MongoDB migration
- **Real-time Communication**: WebSocket server using 'ws' library with room-based messaging for targeted updates
- **Authentication**: JWT-based authentication with role-based access control (admin, team leader)
- **Rate Limiting**: Protection against abuse on critical endpoints, especially TL update operations

### Data Models
- **Users**: Admin and Team Leader accounts with role-based permissions
- **Teams**: Each team has one Team Leader, contains multiple agents, tracks aggregate statistics
- **Agents**: Individual sales representatives with activation targets, current progress, and performance metrics
- **Notifications**: System for admin-initiated company-wide announcements supporting text, image, video, and audio content

### Real-time Features
- **WebSocket Rooms**: 
  - 'leaderboard' room for general updates
  - Team-specific rooms for targeted communications
  - Admin room for administrative functions
- **Live Updates**: Automatic leaderboard recalculation and broadcasting when metrics change
- **Celebration System**: Confetti animations and sound effects triggered by new activations
- **Notification Takeover**: Full-screen notification system with media support and automatic dismissal

### Database Strategy
- **Current**: In-memory storage with proper interface abstractions
- **Migration Ready**: Drizzle ORM configuration present for PostgreSQL migration
- **Schema Design**: Relational structure with proper foreign key relationships between users, teams, and agents

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL driver for future database migration
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect configuration
- **bcryptjs**: Password hashing for secure authentication
- **jsonwebtoken**: JWT token generation and verification
- **express-rate-limit**: API endpoint protection against abuse

### Frontend Libraries
- **@tanstack/react-query**: Server state management with caching and synchronization
- **wouter**: Lightweight React router for client-side navigation
- **zustand**: State management with persistence capabilities
- **@radix-ui/***: Accessible component primitives for UI elements
- **tailwindcss**: Utility-first CSS framework with custom theming

### Development Tools
- **vite**: Fast development server and build tool
- **typescript**: Type safety across the entire application
- **drizzle-kit**: Database migration and schema management tools

### Planned Integrations
- **PostgreSQL Database**: Migration from in-memory to persistent storage using Drizzle ORM
- **File Upload Service**: For user avatars and notification media content
- **Audio Assets**: Celebration sound effects stored in public/sfx directory
- **External Media URLs**: Support for remote images, videos, and audio in notifications