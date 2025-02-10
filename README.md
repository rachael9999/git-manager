# Git Manager

A modern web application for exploring GitHub repositories with advanced features including real-time updates, caching, and trending repository analysis.

## nginx handling
Main application: http://localhost
API endpoints: http://localhost/api/...
Swagger docs: http://localhost/api-docs

## Features

- **Repository Exploration**
  - Browse public GitHub repositories
  - View detailed repository information

- **Trending Repositories**
  - View trending repositories by different time periods (daily, weekly, monthly)
  - Filter by programming language
  - Star count and fork statistics

- **User Profiles**
  - View user information and statistics
  - Browse user repositories

- **Performance Optimizations**
  - Redis caching for improved response times
  - Nginx level caching for static assets
  - Browser-level caching with appropriate headers

- **Health Check and hosting**
  - winston logger
  - dockernized

## Tech Stack

### Frontend
- Vue.js 3
- Vuetify (UI Component Library)
- Vite (Build Tool)
- WebSocket for real-time updates

### Backend
- Node.js
- Express.js
- Redis (Caching)
- Winston (Logging)

### Infrastructure
- Docker & Docker Compose
- Nginx (Reverse Proxy)
- Redis (Cache Layer)

## Prerequisites

- Docker and Docker Compose
- Node.js (v14 or later)
- Git
- GitHub Personal Access Token

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/git-manager.git
cd git-manager
```

2. Environment Setup:
   Create a `.env` file in the root directory with the following variables:
```env
NODE_ENV=development
PORT=3000
SESSION_SECRET=your_session_secret
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token
REDIS_URL=redis://redis:6379
CORS_ORIGIN=http://localhost:5173
```

3. Build and run with Docker Compose:
```bash
docker-compose up --build
```

## Project Structure

```
.
├── frontend/                 # Vue.js frontend application
│   ├── src/                 # Source files
│   ├── public/              # Static files
│   ├── tests/              # Frontend tests
│   ├── nginx.conf          # Nginx configuration
│   └── Dockerfile.dev      # Frontend Docker configuration
├── backend/                # Node.js backend application
│   ├── routes/            # API routes
│   ├── service/           # Business logic
│   ├── middleware/        # Custom middleware
│   ├── utils/            # Utility functions
│   └── Dockerfile.dev    # Backend Docker configuration
└── docker-compose.yml    # Docker compose configuration
```

## API Documentation

### Repositories
- `GET /api/repositories` - Get public repositories
- `GET /api/repositories/:id` - Get repository details
- `GET /api/repositories/trending` - Get trending repositories

### Users
- `GET /api/users/:username` - Get user profile
- `GET /api/users/:username/repos` - Get user repositories

## Caching Strategy

The application implements a multi-layer caching strategy:

1. **Redis Cache**
   - Repository data
   - User profiles
   - Trending repositories
   - Cache invalidation after TTL

## Error Handling

- Winston logger for error tracking
- Structured error responses
- Rate limiting protection
- Graceful fallbacks for API failures

## Development

### Running in Development Mode
```bash
# Start all services
docker-compose up

# Frontend only
cd frontend
npm run dev

# Backend only
cd backend
npm run dev
```

### Running Tests
```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
npm run test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- GitHub API for providing the data
- Vue.js team for the amazing framework
- Docker team for containerization support