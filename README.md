<div align="center">

# Enigma

**Discovery, Verification, and Trust Scoring Platform for Autonomous Agents on Avalanche**

[![CI](https://github.com/ColombiaBlockChain/Enigma/actions/workflows/ci.yml/badge.svg)](https://github.com/ColombiaBlockChain/Enigma/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Avalanche](https://img.shields.io/badge/Avalanche-C--Chain-E84142?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDI0YzYuNjI3IDAgMTItNS4zNzMgMTItMTJTMTguNjI3IDAgMTIgMCAwIDUuMzczIDAgMTJzNS4zNzMgMTIgMTIgMTJ6IiBmaWxsPSIjRTg0MTQyIi8+CjxwYXRoIGQ9Ik0xNi41IDE3SDEzLjVMMTIgMTRMOC41IDE3SDUuNUwxMiA2TDE2LjUgMTdaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4=)](https://www.avax.network/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Live Demo](https://enigma.io) · [Documentation](./docs/README.md) · [API Reference](./docs/api/endpoints.md) · [Report Bug](https://github.com/ColombiaBlockChain/Enigma/issues)

</div>

---

## What is Enigma?

**Enigma** is the "CoinMarketCap for Autonomous Agents" on Avalanche. A Web3 platform that discovers, verifies, ranks, and scores the trustworthiness of AI/autonomous software agents (ERC-804) deployed on Avalanche C-Chain.

### The Problem

In the emerging ecosystem of autonomous agents on blockchain:

- **No centralized visibility** of available agents
- **Users cannot evaluate trustworthiness** before interacting with an agent
- **Malicious agents with hidden proxies** can change behavior post-deployment
- **No reputation standard** for agent-to-agent interactions
- **Legitimate developers have nowhere to showcase** their agents

### The Solution

Enigma provides:

| Feature | Description |
|---------|-------------|
| **Scanner/Directory** | Table view with filters, search, and ranking of all ERC-804 agents |
| **Trust Score** | Composite score (0-100) based on multiple verifiable signals |
| **Centinela Engine** | Active verification that detects proxies, verifies uptime, and analyzes code |
| **Public Profiles** | Each agent has its page with metrics, history, and reputation |
| **REST API** | Programmatic queries for agents evaluating other agents |
| **Feedback System** | Community ratings and reports |

---

## Trust Score Formula

The Trust Score is a weighted composite of five verifiable signals:

```
Trust Score = (Volume × 0.25) + (Proxy × 0.20) + (Uptime × 0.25) + (OZ Match × 0.15) + (Community × 0.15)
```

| Component | Weight | Description |
|-----------|--------|-------------|
| **Volume** | 25% | Transaction activity ranking |
| **Proxy** | 20% | Proxy transparency (100 if none or declared, 0 if hidden) |
| **Uptime** | 25% | Heartbeat response rate (last 24h) |
| **OZ Match** | 15% | OpenZeppelin bytecode similarity |
| **Community** | 15% | Average user ratings (1-5 stars × 20) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.x |
| **Styling** | TailwindCSS + shadcn/ui |
| **State** | TanStack Query |
| **Database** | Supabase (PostgreSQL) + Prisma ORM |
| **Blockchain** | Wagmi 2.x + Viem 2.x |
| **Network** | Avalanche C-Chain (Mainnet/Fuji Testnet) |
| **Auth** | Wallet signature verification |
| **Hosting** | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/ColombiaBlockChain/Enigma.git
cd enigma

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Database (Prisma)
DATABASE_URL=postgresql://postgres:password@localhost:5432/enigma
DIRECT_URL=postgresql://postgres:password@localhost:5432/enigma

# Blockchain
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
NEXT_PUBLIC_CHAIN_ENV=testnet  # or 'mainnet'

# Optional
NEXT_PUBLIC_SNOWTRACE_API_KEY=your-api-key
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # Main app routes
│   │   ├── page.tsx       # Landing page
│   │   ├── scanner/       # Agent directory
│   │   └── agent/[address]/ # Agent profile
│   ├── api/v1/            # REST API routes
│   ├── layout.tsx         # Root layout
│   └── providers.tsx      # React providers
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Header, Footer, Sidebar
│   ├── scanner/           # Scanner-specific components
│   ├── agent/             # Agent profile components
│   └── shared/            # Shared components
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── blockchain/        # Wagmi/Viem config
│   └── utils/             # Utilities
├── hooks/                 # Custom React hooks
├── services/              # Business logic
└── types/                 # TypeScript types
```

See [Folder Structure](./docs/architecture/folder-structure.md) for complete documentation.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma migrate dev` | Run database migrations |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/agents` | List agents with filters |
| `GET` | `/api/v1/agents/:address` | Get agent details |
| `POST` | `/api/v1/agents/register` | Register new agent |
| `GET` | `/api/v1/agents/:address/trust-score` | Get trust score breakdown |
| `GET` | `/api/v1/agents/:address/heartbeats` | Get heartbeat history |
| `POST` | `/api/v1/agents/:address/ratings` | Submit rating |

See [API Documentation](./docs/api/endpoints.md) for complete reference.

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow our [Naming Conventions](./docs/standards/naming-conventions.md)
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: add amazing feature"`
5. Push to your fork: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Guidelines

- Follow [TypeScript Coding Standards](./docs/standards/typescript-guidelines.md)
- Use [Component Patterns](./docs/standards/component-patterns.md)
- Review [Architecture Overview](./docs/architecture/overview.md)

---

## Documentation

| Document | Description |
|----------|-------------|
| [Project Overview](./docs/context/overview.md) | What is Enigma, problem & solution |
| [Architecture](./docs/architecture/overview.md) | System design and data flows |
| [Tech Stack](./docs/architecture/tech-stack.md) | Technologies and dependencies |
| [API Reference](./docs/api/endpoints.md) | REST API documentation |
| [Design System](./docs/design/overview.md) | UI/UX guidelines |
| [Trust Score](./docs/backend/trust-score.md) | Scoring formula details |
| [Roadmap](./docs/business/roadmap.md) | Development phases |

---

## Roadmap

- [x] **Phase 0**: Project Setup & Infrastructure
- [ ] **Phase 1**: Authentication & Backend Core
- [ ] **Phase 2**: Agent Registration
- [ ] **Phase 3**: Scanner/Directory
- [ ] **Phase 4**: Centinela Verification Engine
- [ ] **Phase 5**: Trust Score System
- [ ] **Phase 6**: Agent Profiles
- [ ] **Phase 7**: Feedback System
- [ ] **Phase 8**: Polish & Testing
- [ ] **Phase 9**: Deploy & Launch

See [Development Roadmap](./docs/business/roadmap.md) for details.

---

## Why Avalanche?

- **Performance**: Sub-second finality, low fees (~$0.01)
- **EVM Compatible**: Full Ethereum tooling support
- **Growing Ecosystem**: Active autonomous agents community
- **Subnets**: Future scalability path
- **Hackathon Target**: Built for Avalanche Hackathon

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Avalanche](https://www.avax.network/) - Blockchain platform
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vercel](https://vercel.com/) - Hosting platform
- [Supabase](https://supabase.com/) - Backend as a Service

---

<div align="center">

**Built with dedication for the Avalanche ecosystem**

[Colombia Blockchain](https://github.com/ColombiaBlockChain)

</div>
