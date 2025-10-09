# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Poligap is an AI-powered legal compliance and contract analysis platform that helps organizations ensure regulatory compliance and streamline contract review processes. The platform analyzes documents against frameworks like HIPAA, GDPR, CCPA, SOX, PCI DSS, ISO 27001, and custom organizational policies (RuleBase).

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router and TypeScript
- **UI**: React 19, Radix UI components, Tailwind CSS, shadcn/ui
- **State Management**: Zustand for client state, TanStack Query for server state
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Custom JWT-based auth with middleware protection
- **AI/ML**: Multiple AI providers - Gemini AI (primary), OpenAI, Kroolo AI
- **File Storage**: AWS S3 with presigned URLs
- **Search**: Elasticsearch integration
- **Styling**: Tailwind CSS with custom themes, Framer Motion for animations

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated app routes
│   │   ├── chat/          # AI chat interface
│   │   ├── compliance-check/  # Document compliance analysis
│   │   ├── contract-review/   # Contract analysis features
│   │   ├── knowledge/     # Knowledge base management
│   │   ├── rulebase/      # Custom policy management
│   │   └── dashboard/     # Analytics dashboard
│   ├── api/               # API routes
│   │   ├── ai-chat/       # AI chat endpoints
│   │   ├── compliance-analysis/  # Document analysis
│   │   ├── analytics/     # Analytics endpoints
│   │   └── assets/        # File upload/management
│   ├── auth/              # Authentication pages
│   └── globals.css        # Global styles with Tailwind
├── components/            # Reusable UI components
├── lib/                   # Utility libraries
│   ├── db/               # MongoDB configuration
│   ├── compliance-prompt.ts  # AI prompting system
│   ├── gemini-api.ts     # Gemini AI integration
│   └── s3-config.ts      # AWS S3 setup
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## Development Commands

### Core Development
```bash
# Start development server (standard)
npm run dev

# Start with Turbopack (faster builds)
npm run dev:turbo

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint
```

### Security & Analysis
```bash
# Run security scan
npm run security:scan

# Setup security environment (Windows PowerShell)
npm run security:setup

# Security check (Windows PowerShell)
npm run security:check
```

## Key Features & Components

### AI Analysis System
The platform uses multiple AI providers for document analysis:
- **Primary**: Gemini AI for document parsing and compliance analysis
- **Fallback**: Kroolo AI and OpenAI
- **Analysis Types**: Compliance checking, contract review, policy generation

### Authentication & Authorization
- JWT-based authentication with HTTP-only cookies
- Middleware-based route protection (`middleware.ts`)
- Protected routes: `/dashboard`, `/chat`, `/compliance-check`, etc.
- Public routes: `/auth/signin`, `/auth/signup`

### File Processing Pipeline
1. **Upload**: AWS S3 with presigned URLs
2. **Processing**: Text extraction from PDF/DOC/DOCX files
3. **Analysis**: AI-powered compliance and contract analysis
4. **Storage**: Results stored in MongoDB with audit trails

### Compliance Analysis Workflow
1. Document upload/selection
2. Compliance standards selection (HIPAA, GDPR, etc.)
3. Optional RuleBase (custom policies) application
4. AI analysis with structured gap identification
5. Task generation from findings
6. Export/sharing capabilities

## Environment Setup

### Required Environment Variables
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/poligap
DB_NAME=poligap

# AI Providers
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_GEMINI_API_KEY=your-public-gemini-key

# AWS S3
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=your-bucket-name

# External Services
ELASTICSEARCH_URL=https://your-es-host:443/your-index/_search
ELASTICSEARCH_API_KEY=your-elastic-api-key
REDIS_HOST=localhost
REDIS_PORT=6379

# API URLs
NEXT_PUBLIC_API_URL_KROOLO_AI=https://ai-api.example.com
BACKEND_URL=https://backend.example.com
```

## Key Integration Points

### AI Provider Integration
- **Gemini AI**: Primary analysis engine with document parsing capabilities
- **Compliance Prompting**: Sophisticated prompt engineering in `compliance-prompt.ts`
- **Fallback Strategy**: Multiple AI providers ensure service reliability

### Database Design
- **MongoDB**: Document-based storage for flexible schema
- **Collections**: Users, organizations, analyses, chat history, knowledge base
- **Audit Trails**: Complete tracking of document analysis and user actions

### Frontend Architecture
- **App Router**: Modern Next.js routing with layout nesting
- **Server Components**: Default with client components for interactivity
- **Real-time Features**: Chat interface with streaming AI responses
- **Progressive Enhancement**: Works without JavaScript for core features

## Development Guidelines

### Code Organization
- Components use TypeScript interfaces from `src/types/`
- API routes follow RESTful conventions
- Database operations use Mongoose models
- Error handling with structured error responses

### Authentication Flow
- Users authenticate via `/api/users/signin`
- JWT tokens stored in HTTP-only cookies
- Middleware protects authenticated routes
- Automatic redirect handling for protected/public routes

### AI Analysis Pipeline
- Documents processed through `GeminiComplianceAnalyzer`
- Structured prompts ensure consistent analysis format
- Results parsed to JSON for frontend consumption
- Fallback responses for parsing failures

### File Upload Strategy
- S3 presigned URLs for direct browser upload
- Server-side validation and processing
- Metadata stored in MongoDB
- Temporary URL generation for secure access

## Testing & Debugging

### Development Tools
- Several debugging scripts in root directory
- MongoDB connection testing utilities
- Profile and user management fixes
- AI model testing scripts

### Common Debugging Commands
```bash
# Test AI chat functionality
node test-ai-chat.js

# Debug MongoDB connections
node debug-500-error.js

# Test profile management
node test-profile.js

# Fix database models
node fix-all-models.js
```

## Security Considerations

### Data Protection
- All API keys stored server-side only
- File uploads validated and scanned
- User data segregation by organization
- Audit logging for compliance tracking

### Authentication Security
- JWT tokens with expiration
- HTTP-only cookies prevent XSS
- CSRF protection middleware
- Input validation on all endpoints

## Performance Optimizations

### Frontend
- Turbopack for faster development builds
- Image optimization with Next.js Image component
- Component lazy loading
- TanStack Query for efficient data fetching

### Backend
- MongoDB indexing for fast queries
- S3 CDN for file delivery
- Response caching with Redis
- Optimized AI prompt sizes

## Deployment Notes

### Build Process
- Console logs removed in production/staging
- SVG optimization with SVGR webpack loader
- TypeScript strict mode enabled
- Image domains configured for external sources

### Infrastructure Requirements
- Node.js environment
- MongoDB cluster access
- AWS S3 bucket with proper IAM permissions
- Redis instance for caching
- Elasticsearch cluster for search functionality