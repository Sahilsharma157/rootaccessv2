# RootAccess: The First Blockchain-Based Developer Community Platform

## Overview

RootAccess is a production-grade community platform designed for developers, students, and tech enthusiasts to collaborate on real projects while earning verifiable blockchain-based reputation. It bridges Web2 collaboration features with Web3 verification, creating a transparent ecosystem where achievements cannot be faked.

This project demonstrates end-to-end full-stack development with professional infrastructure, including real-time communication, automated CI/CD pipelines, containerized deployment, and a clear roadmap for blockchain integration using Starknet.

## The Problem

Developers struggle with fragmented collaboration tools. Existing platforms lack:
- Verifiable proof of contributions
- Transparent community governance
- Secure, privacy-preserving communication
- Integration between project collaboration and professional recognition

RootAccess solves this by combining collaborative features with blockchain verification, creating a tamper-proof record of development work.

## Features

### Current Implementation (Phase 1: Web2 Foundation)

**Real-Time Collaboration**
- Instant messaging between team members
- Live community discussions
- Project-based channels and discussions
- Real-time notifications powered by Supabase subscriptions

**Community Management**
- Create and manage communities
- Organize users into teams
- Define community rules and guidelines
- User role management (admin, moderator, member)

**User Profiles & Identity**
- Complete user profiles with portfolio links
- Track user contributions
- Display verified badges and achievements
- Social connection features

**Anonymous Polling System**
- Create polls for community decisions
- Vote anonymously without vote attribution tracking
- View aggregated results only
- Rate limiting to prevent spam

**Security & Privacy**
- Row-Level Security (RLS) on PostgreSQL for data isolation
- JWT-based authentication with secure session management
- bcrypt password hashing for sensitive data
- HTTPS/TLS encryption for all data in transit

## Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19.2 with server components
- **Styling**: Tailwind CSS v4 for responsive design
- **Components**: Shadcn/ui for accessible UI elements
- **State Management**: SWR for client-side data fetching and caching
- **Language**: TypeScript for type safety

### Backend
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with JWT tokens
- **Real-Time**: Supabase Real-Time subscriptions
- **API**: Next.js Route Handlers for server-side endpoints
- **Security**: Row-Level Security (RLS) policies for data protection

### DevOps & Infrastructure
- **CI/CD**: Jenkins with 4-stage automated pipeline
- **Containerization**: Docker for production deployment
- **Version Control**: GitHub with Jenkinsfile-as-Code
- **Pipeline Stages**:
  1. Dependencies - npm install and dependency verification
  2. Build - Next.js compilation and optimization
  3. Docker - Container image creation
  4. Deploy - Production deployment readiness

### Project Management
- **User Stories**: 25+ detailed specifications in Microsoft Planner
- **Architecture**: Microservices-ready for future scalability

## Architecture

### System Design

RootAccess follows a layered architecture designed for scalability and maintainability:

**Presentation Layer**
- Next.js App Router for URL routing
- React Server Components for efficient data fetching
- Client components for interactive features
- Responsive Tailwind CSS styling

**Application Layer**
- Server Actions for secure backend operations
- API Route Handlers for RESTful endpoints
- Real-time listeners for live updates
- Error handling and validation

**Data Access Layer**
- Supabase client for database operations
- Type-safe queries with TypeScript
- Parameterized queries to prevent SQL injection
- Connection pooling for efficiency

**Security Layer**
- Row-Level Security (RLS) policies enforced at database level
- JWT authentication for API endpoints
- Rate limiting on sensitive operations
- Input validation and sanitization

## Getting Started

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager
- GitHub account for version control
- Supabase account for database services

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rootaccessv/rootaccessv2.git
cd rootaccessv2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables by creating a .env.local file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

### Building for Production

Build the optimized production version:
```bash
npm run build
npm start
```

## Project Structure

```
rootaccessv2/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Home page
│   ├── auth/                    # Authentication pages
│   ├── communities/             # Community features
│   ├── messaging/               # Real-time messaging
│   ├── polls/                   # Anonymous polling
│   ├── profiles/                # User profiles
│   └── layout.tsx              # Root layout with providers
├── components/                  # Reusable UI components
│   ├── ui/                     # Shadcn/ui components
│   └── features/               # Feature-specific components
├── lib/                         # Utilities and helpers
│   ├── actions/                # Server Actions
│   ├── supabase/               # Database client
│   └── utils.ts                # Helper functions
├── styles/                      # Global styles
│   └── globals.css             # Tailwind configuration
├── public/                      # Static assets
├── scripts/                     # Database setup scripts
├── SEPM_User_Stories/          # Project requirements
├── Jenkinsfile                 # CI/CD pipeline definition
├── Dockerfile                  # Container configuration
└── package.json               # Dependencies
```

## User Stories

The project includes 25+ detailed user stories covering:

1. User Authentication and Registration
2. Real-Time Direct Messaging
3. Community Creation and Management
4. Community Channels and Discussions
5. Anonymous Polling System
6. User Profiles and Portfolios
7. Notifications and Alerts
8. Search and Discovery
9. User Settings and Preferences
10. Role-Based Access Control
11. And more...

Each user story includes acceptance criteria, technical requirements, and business value.

## DevOps Pipeline

### Jenkins CI/CD Workflow

The automated pipeline ensures code quality and deployment reliability:

**Stage 1: Dependencies**
- Install npm packages
- Verify dependency security
- Validate package integrity

**Stage 2: Build**
- Compile Next.js application
- Optimize for production
- Generate build artifacts

**Stage 3: Docker**
- Build Docker container image
- Tag with version number
- Prepare for deployment

**Stage 4: Deploy**
- Verify deployment readiness
- Execute deployment procedures
- Confirm application health

### Running the Pipeline

The pipeline triggers automatically on GitHub push events:
```bash
git push origin main
```

View pipeline status in Jenkins at http://localhost:8080

## Security Implementation

### Authentication & Authorization
- User passwords hashed with bcrypt
- JWT tokens for API authentication
- Secure session management
- Role-based access control (RBAC)

### Data Protection
- Row-Level Security (RLS) at database level
- Encrypted data in transit (HTTPS/TLS)
- Encrypted sensitive data at rest
- Input validation and sanitization

### Privacy Features
- Anonymous polling without vote attribution
- Data isolation by user ID
- GDPR-compliant data handling
- Regular security audits

## Future Roadmap: Blockchain Integration (Phase 2)

### Starknet Integration

**User Reputation System**
- Reputation scores recorded on Starknet blockchain
- Immutable proof of contributions
- Smart contracts for reputation calculation

**NFT Achievement Badges**
- Mint NFTs for project completions
- Display badges in user profiles
- Verifiable on blockchain
- Transferable achievements

**Decentralized Governance**
- Community voting via smart contracts
- DAO structure for decision-making
- Transparent governance records
- Stakeholder voting rights

**Privacy Features (Zero-Knowledge Proofs)**
- Prove identity without exposing data
- Confidential voting mechanisms
- Private transaction verification
- Encrypted messaging on-chain

**Tokenized Incentives**
- Community tokens for participation
- Reward system for contributions
- Sustainable token economics
- Governance token rights

### Why Starknet?

Starknet provides:
- Scalability for millions of users
- Zero-knowledge proof support for privacy
- Lower transaction costs
- Cairo smart contract language
- Fast finality

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

## Code Quality Standards

- Follow TypeScript strict mode
- Write meaningful variable and function names
- Add comments for complex logic
- Test features before submitting
- Keep commits atomic and well-documented

## Deployment

### Docker Deployment

The application is containerized for easy deployment:

```bash
# Build Docker image
docker build -t rootaccess:latest .

# Run container
docker run -p 3000:80 rootaccess:latest
```

### Environment Configuration

Required environment variables for production:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- Database connection strings
- API authentication keys

## Performance Optimization

- Real-time updates via Supabase subscriptions
- Client-side caching with SWR
- Server-side rendering for initial page load
- Incremental static generation
- Image optimization
- Code splitting and lazy loading

## Troubleshooting

### Common Issues

**Database Connection Error**
- Verify Supabase credentials
- Check environment variables
- Ensure database is running

**Real-Time Updates Not Working**
- Check Supabase real-time settings
- Verify RLS policies
- Confirm WebSocket connection

**Authentication Failing**
- Verify JWT token validity
- Check session expiration
- Confirm authentication flow

## Monitoring & Logging

- Application logs in console
- Error tracking via error boundaries
- Database query logging
- Performance monitoring
- User activity tracking

## Team

Solo Developer: Full-stack implementation including frontend, backend, DevOps, and product management.

Open to collaborators interested in Web3 integration and blockchain features.

## License

This project is open source and available under the MIT License.

## Hackathon Submission

Submitted to: RE{DEFINE} Hackathon 2025 (Starknet)
Platform: DoraHacks
Track: Open/Wildcard (Social Applications)

## Support & Feedback

For questions, suggestions, or issues:
- Open an issue on GitHub
- Check existing documentation
- Review user stories for features

## Acknowledgments

Built with modern web technologies and best practices in mind. Designed for scalability, security, and future Web3 integration.

## Connect

GitHub: https://github.com/Sahilsharma157/rootaccessv2
Hackathon: RE{DEFINE} Hackathon 2026

---

Last Updated: March 2026
Version: 1.0.0
Status: Production Ready

<img width="1365" height="630" alt="image" src="https://github.com/user-attachments/assets/a2d7ce01-9b29-4a12-ac61-baaaedf6c552" />


<img width="1365" height="627" alt="image" src="https://github.com/user-attachments/assets/6b24df22-2dc9-4c8e-a950-cfb8ad44728c" />



