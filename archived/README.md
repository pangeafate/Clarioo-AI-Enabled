# Archived Functional Code - Clarioo

## Overview

This folder contains all functional backend code that was removed during the Sprint 6 (SP_006) conversion from functional MVP to visual prototype. All code is preserved here for future restoration when backend integration begins.

**Archived Date**: November 12, 2024
**Sprint**: SP_006 - MVP to Visual Prototype Conversion
**Status**: Fully Archived and Documented

---

## What's Archived

### 1. Infrastructure Configuration (`/infrastructure/`)
**Purpose**: Production infrastructure setup for local and cloud deployment

**Folders & Files**:
- **`supabase/`** - Supabase CLI configuration
  - `config.toml` - Supabase project configuration
  - `migrations/` - Database migration files

- **`supabase-docker/`** - Local Supabase instance via Docker
  - `docker-compose.yml` - Full Supabase stack (PostgreSQL, PostgREST, GoTrue auth, Kong, etc.)
  - `docker-compose.s3.yml` - S3 storage configuration
  - `.env` - Docker environment variables
  - `reset.sh` - Database reset script
  - `volumes/` - Persistent Docker volumes

- **`kong/`** - Kong API Gateway configuration
  - `kong.yml` - Kong declarative configuration for API routing

- **Docker Files**:
  - `Dockerfile` - Container build configuration
  - `docker-compose.yaml` - Main application container orchestration
  - `.dockerignore` - Docker build exclusions

- **Environment Files**:
  - `.env` - Production environment variables (Supabase URL, keys)
  - `.env.dev` - Development environment variables
  - `.env.local` - Local override variables
  - `env.dev.example` - Template for environment setup

**Why These Were Used**:
- Supabase CLI for database migrations and management
- Docker Compose for local Supabase development (avoids cloud dependency)
- Kong for API gateway and rate limiting
- Multiple env files for different deployment environments

**Restoration Note**: These files are for self-hosted/Docker deployment. If using Supabase Cloud in production, only the env files and migrations are needed.

**Original Location**: Project root

### 2. Supabase Integration (`/supabase/` - Code)
**Purpose**: Database and authentication backend client code

**Files Archived**:
- `client.ts` - Supabase client initialization
- `types.ts` - Database type definitions

**Dependencies**:
- `@supabase/supabase-js` v2.45.4
- `@supabase/auth-helpers-react` v0.5.1

**Original Location**: `src/integrations/supabase/`

### 3. Authentication System (`/hooks/`)
**Purpose**: Real authentication with Supabase Auth

**Files Archived**:
- `useAuth.tsx` - Auth context provider with Supabase integration

**Features**:
- User registration with email verification
- Email/password sign-in
- Session management
- Auth state persistence
- Auth state change listeners

**Original Location**: `src/hooks/useAuth.tsx`

### 4. OpenAI Integration (Embedded in Components)
**Purpose**: AI-powered criteria generation and vendor matching

**Status**: Not separate files - embedded in components

**Affected Components**:
- `src/components/vendor-discovery/CriteriaBuilder.tsx` (lines 48-147)
  - Direct OpenAI API calls
  - Hardcoded API key (line 48)
  - GPT-4 model usage (line 47, 100)

- `src/components/vendor-discovery/VendorSelection.tsx`
  - Similar OpenAI integration pattern

- `src/components/vendor-discovery/ExecutiveSummary.tsx`
  - AI-generated summary logic

- `src/components/vendor-discovery/VendorTable.tsx`
  - AI-powered comparison

**Note**: OpenAI code is inline in components, not in separate service files. When restoring, recommend extracting to `src/services/openai.ts`.

---

## Why Archived

**Rationale for Sprint 6 Conversion**:
1. **Team Alignment**: Visual prototype for stakeholder demonstration
2. **Design Validation**: Confirm UX/UI before backend investment
3. **Reduced Complexity**: Lightweight prototype for rapid iteration
4. **Backend Handoff**: Clean separation makes future integration easier

**Timeline**:
- **Prototype Phase**: November 2024 (current)
- **Functional Implementation**: Q1 2025 (if approved)
- **Estimated Restoration Time**: 12 weeks

---

## Restoration Guide

### Prerequisites

Before restoring functional code, ensure:
1. ✅ Prototype validated by stakeholders
2. ✅ Design feedback incorporated
3. ✅ Budget approved for functional implementation
4. ✅ Development team resources allocated
5. ✅ Supabase project created and configured
6. ✅ OpenAI API account and credits available

### Step-by-Step Restoration (12-Week Plan)

#### Phase 1: Infrastructure Setup (Weeks 1-2)

**1.1 Supabase Setup & Infrastructure Restoration**
```bash
# Option A: Using Supabase Cloud (Recommended)
# Just restore environment files
cp archived/infrastructure/.env.dev.example .env.local
# Edit .env.local with your Supabase Cloud credentials

# Option B: Using Self-Hosted Supabase (Advanced)
# Restore full Docker setup
cp -r archived/infrastructure/supabase-docker ./
cp -r archived/infrastructure/kong ./
cp archived/infrastructure/docker-compose.yaml ./
cd supabase-docker && docker-compose up -d
```

**1.2 Install Dependencies**
```bash
npm install @supabase/supabase-js@2.45.4
npm install @supabase/auth-helpers-react@0.5.1
```

**1.3 Database Migration**
```bash
# Restore Supabase CLI config
cp -r archived/infrastructure/supabase ./

# Run database migrations
supabase db push

# Or manually run migrations from archived/infrastructure/supabase/migrations/
```

#### Phase 2: Restore Supabase Integration (Week 3)

**2.1 Restore Supabase Client**
```bash
# Copy Supabase integration files back
cp -r archived/supabase/* src/integrations/supabase/
```

**2.2 Update Environment Variables**
```typescript
// src/integrations/supabase/client.ts
// Update with new project credentials from .env.local
```

#### Phase 3: Restore Authentication (Week 4)

**3.1 Restore Auth Hook**
```bash
# Remove mock auth
rm src/hooks/useAuth.tsx

# Restore real auth
cp archived/hooks/useAuth.tsx src/hooks/useAuth.tsx
```

**3.2 Update Auth Components**
```typescript
// src/pages/Auth.tsx
// Remove mock auth imports
// Restore Supabase auth integration
```

**3.3 Configure Auth Settings**
- Set up email templates in Supabase
- Configure redirect URLs
- Enable email confirmation (optional)
- Set up password policies

#### Phase 4: Restore OpenAI Integration (Weeks 5-6)

**4.1 Create OpenAI Service**
```bash
mkdir -p src/services
touch src/services/openai.ts
```

**4.2 Extract AI Logic from Components**
```typescript
// src/services/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: false, // Use backend proxy in production
});

export const generateCriteria = async (request: TechRequest) => {
  // Extract logic from CriteriaBuilder.tsx lines 68-147
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [...],
    temperature: 0.3,
  });
  return response.choices[0].message.content;
};

// Similar functions for vendor matching, comparison, etc.
```

**4.3 Update Components**
```typescript
// src/components/vendor-discovery/CriteriaBuilder.tsx
// Remove inline OpenAI calls (lines 48-147)
// Replace with:
import { generateCriteria } from '@/services/openai';

const aiCriteria = await generateCriteria(techRequest);
```

**4.4 Set Up Backend Proxy (Recommended)**
```typescript
// Recommended: Don't call OpenAI from frontend
// Create backend endpoint for AI requests
// Frontend → Backend API → OpenAI API
```

#### Phase 5: Replace Mock Services (Weeks 7-8)

**5.1 Remove Mock Services**
```bash
rm -rf src/services/mock/
rm -rf src/data/api/
```

**5.2 Create Real Services**
```typescript
// src/services/projectService.ts
import { supabase } from '@/integrations/supabase/client';

export const projectService = {
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createProject(project: CreateProjectDto) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ... more methods
};
```

**5.3 Update Component Imports**
```typescript
// Before (Mock):
import { projectService } from '@/services/mock/projectService';

// After (Real):
import { projectService } from '@/services/projectService';
```

#### Phase 6: Testing & QA (Weeks 9-10)

**6.1 Unit Tests**
```bash
# Set up Vitest (see GL-TDD.md)
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Write tests for services
# Target: 80%+ coverage
```

**6.2 Integration Tests**
```bash
# Test auth flow
# Test project CRUD
# Test AI integration
# Test workflow completion
```

**6.3 E2E Tests**
```bash
# Set up Playwright
npm install -D @playwright/test

# Write E2E tests for critical paths
```

#### Phase 7: Performance & Security (Week 11)

**7.1 Security Audit**
- Review RLS policies
- Audit API key management
- Implement rate limiting
- Set up CORS policies
- Enable auth token rotation

**7.2 Performance Optimization**
- Add database indexes
- Implement caching strategy
- Optimize query patterns
- Add loading states
- Implement error boundaries

#### Phase 8: Deployment (Week 12)

**8.1 CI/CD Setup**
```bash
# GitHub Actions for automated testing
# Vercel/Netlify deployment
```

**8.2 Environment Configuration**
- Staging environment setup
- Production environment setup
- Monitoring and logging (Sentry)

**8.3 Soft Launch**
- Deploy to staging
- Internal testing
- Beta user testing
- Production deployment

---

## File Mapping Reference

### Infrastructure
| Archived File | Restore To | Description |
|--------------|-----------|-------------|
| `infrastructure/supabase/` | `supabase/` | Supabase CLI config & migrations |
| `infrastructure/supabase-docker/` | `supabase-docker/` | Local Supabase Docker setup |
| `infrastructure/kong/` | `kong/` | Kong API gateway config |
| `infrastructure/Dockerfile` | `Dockerfile` | Container build file |
| `infrastructure/docker-compose.yaml` | `docker-compose.yaml` | Docker orchestration |
| `infrastructure/.env` | `.env` | Production env vars |
| `infrastructure/.env.dev` | `.env.dev` | Development env vars |
| `infrastructure/env.dev.example` | `.env.local` | Environment template |

### Supabase Integration (Code)
| Archived File | Restore To | Description |
|--------------|-----------|-------------|
| `supabase/client.ts` | `src/integrations/supabase/client.ts` | Supabase client |
| `supabase/types.ts` | `src/integrations/supabase/types.ts` | Database types |

### Authentication
| Archived File | Restore To | Description |
|--------------|-----------|-------------|
| `hooks/useAuth.tsx` | `src/hooks/useAuth.tsx` | Auth context provider |

### OpenAI (Requires Extraction)
| Component | Lines | Extract To |
|-----------|-------|-----------|
| `CriteriaBuilder.tsx` | 48-147 | `src/services/openai.ts` |
| `VendorSelection.tsx` | TBD | `src/services/openai.ts` |
| `ExecutiveSummary.tsx` | TBD | `src/services/openai.ts` |
| `VendorTable.tsx` | TBD | `src/services/openai.ts` |

---

## Mock Services to Real Services Mapping

### Authentication Service
```typescript
// Mock (Current)
src/services/mock/authService.ts
→ Always succeeds, dummy user data

// Real (Future)
src/hooks/useAuth.tsx (from archived/hooks/)
→ Supabase authentication
```

### Project Service
```typescript
// Mock (Current)
src/services/mock/projectService.ts
→ Returns JSON from src/data/api/projects.json

// Real (Future)
src/services/projectService.ts
→ Supabase database queries
→ CRUD operations on 'projects' table
```

### AI Service
```typescript
// Mock (Current)
src/services/mock/aiService.ts
→ Returns pre-generated JSON responses

// Real (Future)
src/services/openai.ts
→ OpenAI API integration
→ GPT-4 for criteria generation
→ GPT-4 for vendor matching
```

---

## Environment Variables Required

### Supabase
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### OpenAI
```bash
VITE_OPENAI_API_KEY=sk-...
# Note: In production, use backend proxy instead of frontend API calls
```

---

## Dependencies to Restore

Add to `package.json`:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "@supabase/auth-helpers-react": "^0.5.1",
    "openai": "^4.20.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

---

## Database Schema Reference

When restoring, create these tables in Supabase:

### users_extended
```sql
CREATE TABLE users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  workflow_state JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### vendors
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  scores JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Note**: Full migration files may be available in `/supabase/migrations/` if they exist.

---

## Testing Restoration

After restoration, test each component:

1. ✅ **Auth Flow**
   - Sign up new user
   - Verify email confirmation
   - Sign in existing user
   - Session persistence
   - Sign out

2. ✅ **Project Management**
   - Create new project
   - List user projects
   - Update project
   - Delete project

3. ✅ **AI Integration**
   - Generate criteria
   - Select vendors
   - Generate comparison
   - Chat with AI assistant

4. ✅ **Workflow Completion**
   - Complete all 5 steps
   - Save progress
   - Generate email templates

---

## Troubleshooting

### Common Issues During Restoration

#### Issue 1: Supabase Connection Errors
```
Error: Invalid Supabase URL or key
```
**Solution**:
- Verify `.env.local` has correct credentials
- Check Supabase project is active
- Ensure anon key has correct permissions

#### Issue 2: Authentication Not Persisting
```
User logs out after page refresh
```
**Solution**:
- Check Supabase auth state listener in useAuth.tsx
- Verify session storage is enabled
- Check auth redirect URLs

#### Issue 3: OpenAI API Errors
```
Error: 429 Rate Limit Exceeded
```
**Solution**:
- Check OpenAI API key is valid
- Verify billing is active
- Implement request throttling
- Consider backend proxy for production

#### Issue 4: CORS Errors
```
Cross-Origin Request Blocked
```
**Solution**:
- Configure allowed origins in Supabase dashboard
- Add production URL to allowed origins
- Use Supabase Auth helpers for auth requests

---

## Cost Estimates (After Restoration)

### Supabase (Free Tier)
- Database: 500MB storage (free)
- Auth: Unlimited users (free)
- API Requests: 500,000/month (free)

### Supabase (Pro - $25/month)
- Database: 8GB storage
- Auth: Unlimited users
- API Requests: 5,000,000/month

### OpenAI API
- GPT-4 Turbo: ~$0.01 per 1K tokens
- Estimated: $50-200/month (depending on usage)
- Criteria generation: ~1000 tokens per request
- Vendor matching: ~2000 tokens per request

---

## Support & Resources

### Documentation
- [PROJECT_ROADMAP.md](../00_IMPLEMENTATION/PROJECT_ROADMAP.md) - Full restoration timeline
- [ARCHITECTURE.md](../00_PLAN/ARCHITECTURE.md) - System architecture
- [SP_006](../00_IMPLEMENTATION/SPRINTS/SP_006_MVP_to_Visual_Prototype_Conversion.md) - Conversion details

### External Resources
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [React Auth Best Practices](https://reactjs.org/docs/hooks-reference.html)

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | Nov 12, 2024 | Initial archive during SP_006 conversion |

---

## Archive Status

**Status**: ✅ Complete
**Total Files Archived**: 7 files + embedded OpenAI code
**Estimated Restoration Time**: 12 weeks
**Estimated Restoration Cost**: $3,000-5,000 (development time)

---

*All code in this archive is preserved exactly as it was before the prototype conversion. No functional code was lost - it's all here, ready for restoration when backend integration begins.*

**Last Updated**: November 12, 2024
**Maintained By**: Development Team
