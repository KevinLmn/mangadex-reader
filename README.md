# MangaDex Reader

A high-performance fullstack manga reader, powered by **Fastify**, **Next.js 14**, and **TurboRepo**. This monorepo hosts both the backend API and frontend web application — designed for speed, scalability, and a polished reading experience.

---

## Preview

| Home | Reader |
|------|--------|
| ![Home](./assets/homepage.png) | ![Reader](./assets/reader.gif) |

---

## Features

### Reading Experience
- **Page-by-page reader** with smooth transitions
- **Quality toggle** - Switch between high quality and data-saver modes
- **Keyboard navigation** - Use arrow keys to navigate pages
- **Click navigation** - Click left/right side of the page to navigate
- **Reading progress tracking** - Automatically saves your progress per manga
- **Continue Reading** - Resume where you left off from the homepage

### Discovery
- **Popular manga carousel** - Featured manga on the homepage
- **Latest updates** - Recently updated manga
- **Search** - Find manga by title with pagination

### User Features
- **User authentication** - Register and login
- **Favorites** - Save manga to your personal list
- **Reading history** - Track your reading progress across all manga

### Performance
- **Redis caching** - 24-hour cache for chapter pages and metadata
- **IndexedDB caching** - Browser-side caching for offline access
- **Image prefetching** - Preloads adjacent pages for smooth reading
- **Lazy loading** - Efficient loading of manga covers and details

### Chapter Downloads
- **Download chapters** - Download full chapters as merged PNG images

---

## Tech Stack

### Backend (Fastify)
- **Fastify 5** - High-performance Node.js server
- **Prisma ORM** - Database management with PostgreSQL
- **Redis 7** - Caching layer
- **Sharp** - Image processing
- **JWT** - Authentication
- **TypeBox** - Runtime type validation

### Frontend (Next.js)
- **Next.js 14** with App Router
- **React 18** with Server Components
- **TanStack React Query v5** for data fetching
- **Tailwind CSS** for styling
- **Dexie.js** for IndexedDB storage
- **Framer Motion** for animations

### Infrastructure
- **Docker & Docker Compose** - Containerized development and production
- **PostgreSQL 16** - Primary database
- **Redis 7** - Caching layer
- **TurboRepo** - Monorepo build system
- **PNPM** - Package manager

---

## Project Structure

```
mangadex-reader/
├── frontend/                 # Next.js application
│   ├── app/                  # App router pages
│   │   ├── [id]/             # Manga detail & reader pages
│   │   ├── favorites/        # User favorites page
│   │   ├── login/            # Login page
│   │   ├── register/         # Registration page
│   │   └── search/           # Search results page
│   ├── features/             # Feature-specific components
│   │   ├── details/          # Manga details components
│   │   ├── looby/            # Homepage components
│   │   └── reader/           # Reader components
│   └── shared/               # Shared components, hooks, utilities
│       ├── components/       # Reusable UI components
│       ├── context/          # React contexts (Auth)
│       ├── lib/              # Utilities, API, queries
│       └── types/            # TypeScript types
├── backend-fastify/          # Fastify API server
│   ├── src/
│   │   ├── plugins/          # Fastify plugins
│   │   │   ├── core/         # Core plugins (prisma, redis, env)
│   │   │   ├── external/     # External plugins (cors, jwt, rate-limit)
│   │   │   └── app/          # App plugins (image-service, mangadex)
│   │   ├── routes/           # API routes (auto-loaded)
│   │   │   └── api/          # /api/* routes
│   │   └── scripts/          # Utility scripts
│   └── prisma/               # Database schema and migrations
├── docker-compose.dev.yml    # Development environment
└── docker-compose.yml        # Production environment
```

---

## Getting Started

### Prerequisites

- **Node.js 22+**
- **pnpm 8+**
- **Docker & Docker Compose**

### 1. Clone the repository

```bash
git clone <repository-url>
cd mangadex-reader
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_USER=kevin
POSTGRES_PASSWORD=password
POSTGRES_DB=manga

# Redis
REDIS_PASSWORD=password
```

Create a `.env` file in `backend-fastify/`:

```env
# Database
DATABASE_URL=postgresql://kevin:password@postgres:5432/manga

# Server
PORT=3012

# MangaDex API
MANGADEX_BASE_URL=https://api.mangadex.org

# Frontend URL (for CORS)
FRONT_END_URL=http://localhost:3011

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=password

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
COOKIE_SECRET=your-super-secret-cookie-key-32ch
COOKIE_NAME=mangadex_session
COOKIE_SECURED=false

# Rate Limiting
RATE_LIMIT_MAX=100

# Backend URL
BACK_END_URL=http://localhost:3012
```

Create a `.env` file in `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3012/api
NEXT_PUBLIC_FRONT_END_URL=http://localhost:3011
```

### 4. Start the development environment

```bash
pnpm dev
```

This starts all services with Docker:
- **Frontend** at http://localhost:3011
- **Backend** at http://localhost:3012
- **PostgreSQL** at localhost:5433
- **Redis** at localhost:6379

### 5. Run database migrations

```bash
docker compose -f docker-compose.dev.yml exec backend-fastify npx prisma migrate dev
```

### 6. (Optional) Warm the cache

Pre-populate the cache with popular and latest manga:

```bash
docker compose -f docker-compose.dev.yml exec backend-fastify pnpm warm-cache
```

---

## Available Commands

### Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start full stack with Docker |
| `pnpm dev:local` | Start frontend + backend locally |

### Build & Production

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm start` | Start production servers |
| `pnpm start:docker` | Start Docker production stack |

### Database

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Prisma Studio |

### Maintenance

| Command | Description |
|---------|-------------|
| `pnpm clean` | Clean dist directories |
| `pnpm clean:docker` | Remove Docker containers & volumes |
| `pnpm stop:docker` | Stop Docker services |

### Code Quality

| Command | Description |
|---------|-------------|
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format code |
| `pnpm test` | Run tests |

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user (protected) |

### Manga

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/manga/:id` | Get manga details and chapters |
| GET | `/api/search?q=query` | Search manga by title |
| GET | `/api/popular` | Get popular manga |
| GET | `/api/latest` | Get latest updates |

### Chapters

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/manga/chapter/:chapterId/:page` | Get chapter page image |
| GET | `/api/manga/chapter/:chapterId/total` | Get total pages |
| GET | `/api/manga/chapter/:chapterId/info` | Get chapter info |
| GET | `/api/manga/:id/download/:chapterId` | Download full chapter |

### Favorites (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | Get user favorites |
| POST | `/api/favorites` | Add to favorites |
| DELETE | `/api/favorites/:mangaId` | Remove from favorites |
| GET | `/api/favorites/:mangaId` | Check if favorited |

### Reading Progress (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress/:mangaId` | Get progress for manga |
| POST | `/api/progress` | Save reading progress |
| GET | `/api/progress` | Get all reading progress |
| DELETE | `/api/progress/:mangaId` | Delete progress |

### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/proxy/image?url=...` | Proxy image requests |
| GET | `/healthz` | Health check |

---

## Keyboard Shortcuts

When reading a manga:

| Key | Action |
|-----|--------|
| `←` | Previous page |
| `→` | Next page |
| `?` | Show shortcuts modal |

---

## Database Schema

```prisma
model User {
  id              String            @id @default(uuid())
  email           String            @unique
  password        String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  favorites       Favorite[]
  readingProgress ReadingProgress[]
}

model Favorite {
  id      String   @id @default(uuid())
  user    User     @relation(fields: [userId], references: [id])
  userId  String
  mangaId String
  addedAt DateTime @default(now())

  @@unique([userId, mangaId])
}

model ReadingProgress {
  id         String   @id @default(uuid())
  user       User     @relation(fields: [userId], references: [id])
  userId     String
  mangaId    String
  chapterId  String
  page       Int      @default(1)
  totalPages Int?
  updatedAt  DateTime @updatedAt

  @@unique([userId, mangaId])
}
```

---

## Troubleshooting

### Images not loading

1. Check if your router/firewall is blocking `api.mangadex.org`
2. Verify Redis is running:
   ```bash
   docker compose -f docker-compose.dev.yml ps
   ```
3. Clear Redis cache:
   ```bash
   docker compose -f docker-compose.dev.yml exec redis redis-cli -a password FLUSHALL
   ```

### Database errors

1. Run migrations:
   ```bash
   docker compose -f docker-compose.dev.yml exec backend-fastify npx prisma migrate dev
   ```
2. Check database connection:
   ```bash
   docker compose -f docker-compose.dev.yml exec postgres psql -U kevin -d manga
   ```

### Backend not responding

1. Check logs:
   ```bash
   docker compose -f docker-compose.dev.yml logs backend-fastify
   ```
2. Restart backend:
   ```bash
   docker compose -f docker-compose.dev.yml restart backend-fastify
   ```

### Continue Reading not showing

1. Make sure you're logged in
2. Verify the ReadingProgress table exists (run migrations)
3. Read a few pages of a manga to create progress data

---

## License

MIT

