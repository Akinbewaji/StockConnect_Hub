# StockConnect Frontend

React + Vite frontend application for StockConnect inventory management system.

## Features

- Modern React 19 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- JWT authentication
- Responsive design
- API integration with backend

## Prerequisites

- Node.js 18+
- npm or yarn

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment variables**:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your values:
   - `VITE_API_BASE_URL`: Your backend API URL (default: http://localhost:5000)
   - `VITE_GEMINI_API_KEY`: Your Gemini API key for chatbot

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### API Proxy

In development, the frontend is configured to proxy API requests to the backend:

- `/api/*` requests are forwarded to `http://localhost:5000`

This allows you to develop both frontend and backend simultaneously without CORS issues.

## Production

1. **Build the project**:

   ```bash
   npm run build
   ```

2. **Preview the production build**:
   ```bash
   npm run preview
   ```

## Project Structure

```
Frontend/
├── src/
│   ├── components/          # React components
│   ├── context/           # React context (Auth, etc.)
│   ├── layouts/           # Layout components
│   ├── pages/             # Page components
│   │   ├── admin/         # Admin pages
│   │   ├── auth/          # Authentication pages
│   │   └── shop/         # Shop pages
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main App component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── index.html            # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env
```

## Environment Variables

| Variable              | Description                | Default               |
| --------------------- | -------------------------- | --------------------- |
| `VITE_API_BASE_URL`   | Backend API base URL       | http://localhost:5000 |
| `VITE_GEMINI_API_KEY` | Gemini API key for chatbot | (optional)            |

## Authentication

The frontend uses JWT tokens for authentication. Tokens are stored in localStorage and included in API requests via the Authorization header.

## API Communication

The frontend communicates with the backend through:

1. **Direct API calls** (production): Uses `VITE_API_BASE_URL` environment variable
2. **Proxy** (development): Vite proxies `/api` requests to backend

### API Utility

Use the `authFetch` utility from `src/utils/api.ts` for authenticated requests:

```typescript
import { authFetch } from "./utils/api";

const response = await authFetch("/products");
const data = await response.json();
```

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 6
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Motion

## License

MIT
