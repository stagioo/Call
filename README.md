<div align="center">
  <img src="apps/web/public/logo.png" alt="Call Logo" width="120" height="120" style="border-radius: 20px;">
  <h1 align="center">Call</h1>
  <p align="center">
    <strong>An Open-source AI-native alternative to Google Meet and Zoom</strong>
  </p>
  <p align="center">
    Ready to escape complex, data-hungry meeting apps? Join the future of video calling.
  </p>

<<<<<<< Updated upstream

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
- # **Offline capabilities** for basic features
<div align="center">
  <img src="apps/web/public/logo.png" alt="Call Logo" width="120" height="120" />
  <h3>Modern video calling for teams</h3>
</div>

An open-source alternative to Google Meet and Zoom, built for the modern workplace.

- [Website](https://joincall.co)
- [GitHub](https://github.com/joincalldotco/call)
- [Discord](https://discord.com/invite/bre4echNxB)
- [Twitter](https://x.com/joincalldotco)

---

## Why Call?

Traditional video calling platforms are complex, data-hungry, and often lack the features modern teams need. Call is built from the ground up to be:

- **Privacy-first** - Your data stays yours
- **AI-enhanced** - Intelligent features that actually help
- **Developer-friendly** - Open source and extensible
- **Performance-focused** - Lightweight and fast
- **Team-oriented** - Built for collaboration, not just meetings
  > > > > > > > Stashed changes

---

## 🛠 Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
  <<<<<<< Updated upstream
- **shadcn/ui** - Beautiful component library
- **LiveKit** - Real-time video/audio communication - Working on the migration to Mediasoup
- # **React Query** - Server state management
- **shadcn/ui** - Component library
- **Mediasoup-SFU** - Scalable video conferencing
- **React Query** - Server state management
- **Zustand** - State management
  > > > > > > > Stashed changes

### Backend

- **Hono** - Fast web framework
  <<<<<<< Updated upstream
- **Bun** - JavaScript runtime
- **PostgreSQL** - Reliable database
- **Drizzle ORM** - Type-safe database queries
- # **Better Auth** - Authentication system
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe queries
- **Better Auth** - Authentication
  > > > > > > > Stashed changes

### Infrastructure

- **Turborepo** - Monorepo build system
- **Docker** - Containerization
- **Vercel** - Deployment
- **Rate Limiting** - API protection

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** package manager
- **Docker** and Docker Compose
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Call0dotco/call.git
   cd call
   ```

2. **Start development environment**

   ```bash
   ./setup-dev.sh
   ```

   This script automatically:

   - Creates `.env` file if needed
   - Installs dependencies
   - Starts Docker services (PostgreSQL)
   - Waits for database readiness
   - Starts development environment

<<<<<<< Updated upstream

- ✅ Create a `.env` file if it doesn't exist
- 📦 Install dependencies if needed
- 🐳 Start Docker services (PostgreSQL)
- ⏳ Wait for the database to be ready
- # 🚀 Start the development environment
  > **Note:** For troubleshooting, check [ERRORS.md](ERRORS.md)
  >
  > > > > > > > Stashed changes

3. **Open your browser**
   - Web app: http://localhost:3000
   - Server: http://localhost:1284

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/call

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email
EMAIL_FROM=your_email@domain.com
RESEND_API_KEY=your_resend_api_key

# App URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:1284

# App Configuration
NODE_ENV=development

# Better Auth Secret (generate at https://www.better-auth.com/docs/installation)
BETTER_AUTH_SECRET=your_generated_secret
```

### Docker Services

```bash
# Start services
pnpm docker:up

# Stop services
pnpm docker:down

# Clean up
pnpm docker:clean
```

---

## 📁 Project Structure

```
call/
├── apps/                    # Applications
│   ├── web/                # Next.js web application
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   └── lib/          # Utilities and configs
│   └── server/            # Hono backend API
│       ├── routes/        # API routes
│       ├── config/        # Server configuration
│       └── utils/         # Server utilities
├── packages/               # Shared packages
│   ├── auth/              # Authentication utilities
│   ├── db/                # Database schemas
│   ├── ui/                # Shared UI components
│   ├── eslint-config/     # ESLint configuration
│   └── typescript-config/ # TypeScript configuration
└── docker-compose.yml      # Docker services
```

---

## 🧪 Development

### Scripts

```bash
# Development
pnpm dev                    # Start all applications
pnpm dev --filter web      # Start only web app
pnpm dev --filter server   # Start only server

# Building
pnpm build                 # Build all packages
pnpm build --filter web    # Build only web app

# Code Quality
pnpm lint                  # Lint all packages
pnpm lint:fix             # Fix linting issues
pnpm format               # Check formatting
pnpm format:fix           # Fix formatting

# Database
pnpm db:generate          # Generate database types
pnpm db:migrate           # Run migrations
pnpm db:push              # Push schema changes
pnpm db:studio            # Open database studio
```

### Package Management

```bash
# Install dependency in specific workspace
pnpm add <package> --filter <workspace-name>

# Install dependency in all workspaces
pnpm add -w <package>

# Link local package
pnpm add @call/<package-name> --filter <workspace-name> --workspace
```

### Development Workflow

1. **Create feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** following coding standards

3. **Run checks before committing**

   ```bash
   pnpm lint
   pnpm build
   ```

4. **Commit using conventional commits**

   ```
   feat: add new feature
   fix: resolve bug
   docs: update documentation
   chore: update dependencies
   refactor: improve code structure
   test: add tests
   ui: for ui changes
   ```

5. **Push and create pull request**

---

<<<<<<< Updated upstream

## 🙏 Acknowledgments

- **All contributors** who help make Call better every day

## 📞 Support

=======

## Support

> > > > > > > Stashed changes

- **Discord**: [Join our community](https://discord.com/invite/bre4echNxB)
- **Email**: attiyassr@gmail.com
- **Twitter**: [@joincalldotco](https://x.com/joincalldotco)

---

<div align="center">
<<<<<<< Updated upstream
  <p>Made with ❤️ by the Call team</p>
  <p>
    <a href="https://joincall.co">Website</a> •
    <a href="https://github.com/Call0dotco/call">GitHub</a> •
    <a href="https://discord.com/invite/bre4echNxB">Discord</a> •
    <a href="https://x.com/joincalldotco">Twitter</a>
  </p>
</div>
=======
  Made with ❤️ by the Call team
</div>

[Website](https://joincall.co) • [GitHub](https://github.com/Call0dotco/call) • [Discord](https://discord.com/invite/bre4echNxB) • [Twitter](https://x.com/joincalldotco)

> > > > > > > Stashed changes
