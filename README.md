<div align="center">
  <img src="apps/web/public/logo.png" alt="Call Logo" width="120" height="120" style="border-radius: 20px;">
  <h1 align="center">Call</h1>
  <p align="center">
    <strong>An Open-source AI-native alternative to Google Meet and Zoom</strong>
  </p>
  <p align="center">
    Ready to escape complex, data-hungry meeting apps? Join the future of video calling.
  </p>
  
  <div align="center">
    <a href="https://joincall.co">
      <img src="https://img.shields.io/badge/Website-joincall.co-blue?style=for-the-badge&logo=globe" alt="Website">
    </a>
    <a href="https://github.com/joincalldotco/call">
      <img src="https://img.shields.io/badge/GitHub-joincalldotco/call-black?style=for-the-badge&logo=github" alt="GitHub">
    </a>
    <a href="https://discord.com/invite/bre4echNxB">
      <img src="https://img.shields.io/badge/Discord-Join%20Community-blue?style=for-the-badge&logo=discord" alt="Discord">
    </a>
    <a href="https://x.com/joincalldotco">
      <img src="https://img.shields.io/badge/X-%40joincalldotco-black?style=for-the-badge&logo=x" alt="X (Twitter)">
    </a>
  </div>
</div>

---

## 🚀 Features

### 🎥 **Video Calling**

### 👥 **Team Collaboration**

### 📞 **Contact Management**

### 📅 **Meeting Scheduling**

### 🤖 **AI-Powered Features**

### 🔒 **Security & Privacy**

### 🌐 **Cross-Platform**

- **Web-based** - works on any modern browser
- **Mobile responsive** design
- **Progressive Web App** (PWA) support
- **Offline capabilities** for basic features

---

## 🛠 Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **LiveKit** - Real-time video/audio communication - Working on the migration to Mediasoup
- **React Query** - Server state management

### Backend

- **Hono** - Fast web framework
- **Bun** - JavaScript runtime
- **PostgreSQL** - Reliable database
- **Drizzle ORM** - Type-safe database queries
- **Better Auth** - Authentication system

### Infrastructure

- **Turborepo** - Monorepo build system
- **Docker** - Containerization
- **Vercel** - Deployment platform
- **Rate Limiting** - API protection

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20 or higher
- **pnpm** package manager
- **Docker** and Docker Compose
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Call0dotco/call.git
   cd call
   ```

2. **Start the development environment**

   ```bash
   ./run-dev.sh
   ```

   This script will automatically:

   - ✅ Create a `.env` file if it doesn't exist
   - 📦 Install dependencies if needed
   - 🐳 Start Docker services (PostgreSQL)
   - ⏳ Wait for the database to be ready
   - 🚀 Start the development environment

3. **Open your browser**
   - Web app: http://localhost:3000
   - Server: http://localhost:1284

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/call

# Google OAuth (for authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Configuration (for notifications)
EMAIL_FROM=your_email@domain.com
RESEND_API_KEY=your_resend_api_key

# App URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:1284

# App Configuration
NODE_ENV=development

go to <a target="_blank" href="https://www.better-auth.com/docs/installation" >Better auth installation</a> and click on 'Generate Secret'.
BETTER_AUTH_SECRET=your_generated_secret
```

### Docker Services

The project uses Docker Compose to run PostgreSQL:

```bash
# Start services
pnpm docker:up

# Stop services
pnpm docker:down

# Clean up (removes volumes)
pnpm docker:clean
```

---

## 📁 Project Structure

```
call/
├── apps/                    # Applications
│   ├── web/                # Next.js web application
│   │   ├── app/           # App Router pages
│   │   │   ├── (app)/     # Main app routes
│   │   │   ├── (auth)/    # Authentication routes
│   │   │   └── (waitlist)/ # Landing page
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities and configs
│   │   └── public/       # Static assets
│   └── server/            # Hono backend API
│       ├── routes/        # API routes
│       ├── config/        # Server configuration
│       ├── utils/         # Server utilities
│       └── validators/    # Request validation
├── packages/               # Shared packages
│   ├── auth/              # Authentication utilities
│   ├── db/                # Database schemas and migrations
│   ├── ui/                # Shared UI components (shadcn/ui)
│   ├── eslint-config/     # ESLint configuration
│   └── typescript-config/ # TypeScript configuration
├── docker-compose.yml      # Docker services
├── run-dev.sh             # Development setup script
└── turbo.json             # Turborepo configuration
```

---

## 🧪 Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start all applications
pnpm dev --filter web      # Start only web app
pnpm dev --filter server   # Start only server

# Building
pnpm build                 # Build all packages
pnpm build --filter web    # Build only web app

# Linting & Formatting
pnpm lint                  # Lint all packages
pnpm lint:fix             # Fix linting issues
pnpm format               # Check formatting
pnpm format:fix           # Fix formatting

# Database
pnpm db:generate          # Generate database types
pnpm db:migrate           # Run database migrations
pnpm db:push              # Push schema changes
pnpm db:studio            # Open database studio

# Docker
pnpm docker:up            # Start Docker services
pnpm docker:down          # Stop Docker services
pnpm docker:clean         # Clean up Docker volumes
```

### Package Management

We use pnpm workspaces to manage this monorepo:

```bash
# Install a dependency in a specific workspace
pnpm add <package> --filter <workspace-name>

# Install a dependency in all workspaces
pnpm add -w <package>

# Link a local package in another workspace
pnpm add @call/<package-name> --filter <workspace-name> --workspace
```

### Development Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Run checks before committing**

   ```bash
   pnpm lint      # Lint all packages
   pnpm build     # Build all packages
   ```

4. **Commit your changes** using conventional commits:

   ```
   feat: add new feature
   fix: resolve bug
   docs: update documentation
   chore: update dependencies
   refactor: improve code structure
   test: add tests
   ui: for ui changes
   ```

5. **Push and create a pull request**

### Package Organization

- Place shared code in `packages/`
- Keep applications in `apps/`
- Use consistent naming conventions:
  - Applications: `@call/app-name`
  - Packages: `@call/package-name`

### Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## 🙏 Acknowledgments

- **All contributors** who help make Call better every day

## 📞 Support

- **Discord**: [Join our community](https://discord.com/invite/bre4echNxB)
- **Email**: attiyassr@gmail.com
- **Twitter**: [@joincalldotco](https://x.com/joincalldotco)

---

<div align="center">
  <p>Made with ❤️ by the Call team</p>
  <p>
    <a href="https://joincall.co">Website</a> •
    <a href="https://github.com/Call0dotco/call">GitHub</a> •
    <a href="https://discord.com/invite/bre4echNxB">Discord</a> •
    <a href="https://x.com/joincalldotco">Twitter</a>
  </p>
</div>
