
# YouTube Clone

## Overview
A full-stack video streaming application built with modern web technologies.

## Features
- User authentication and profiles
- Video upload and playback
- Search and recommendations
- Like, comment, and subscribe functionality
- Playlist management
- Watch history tracking

## Tech Stack
- **Backend:** Node.js, Express.js
- **Frontend:** React, Redux
- **Database:** MongoDB
- **Storage:** Cloud storage for videos
- **Authentication:** JWT

## Installation

```bash
# Clone repository
git clone <your-repo-url>

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Project Structure
```
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── middleware/
├── frontend/
│   ├── src/
│   ├── components/
│   └── pages/
└── README.md
```

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/videos/upload` - Upload video
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get single video

## Contributing
Pull requests are welcome. For major changes, open an issue first.

## License
MIT
