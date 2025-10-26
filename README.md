# SMTP Email Sender - Full Stack Application

A professional email sending platform built with Next.js 14, featuring role-based access control, rich text editing, and SMTP integration. Optimized for deployment on Vercel's free tier.

## Features

### Core Functionality
- **User Authentication**: Secure login system with NextAuth.js
- **Role-Based Access Control**:
  - Superadmin: Full control over email addresses and user management
  - Regular Users: Fixed "From" address with full email sending capabilities
- **Rich Email Composer**: Gmail-like interface with TipTap editor
- **Email Management**: To, CC, BCC, attachments support
- **Email History**: Track sent emails with detailed statistics
- **Rate Limiting**: Configurable email limits per user
- **SMTP Integration**: Full Nodemailer support

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes (Serverless Functions)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **Email**: Nodemailer with SMTP
- **Rich Text**: TipTap Editor
- **UI Components**: Custom components with Lucide icons

## Quick Start

### Prerequisites
- Node.js 18.17.0 or higher
- PostgreSQL database (Vercel Postgres recommended)
- SMTP credentials (Gmail, SendGrid, etc.)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd smtp-mail-sender
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database (Get from Vercel Postgres)
DATABASE_URL="postgres://user:password@host:5432/database"

# NextAuth (Generate random string: openssl rand -base64 32)
NEXTAUTH_SECRET="your-random-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Domain Configuration
# This domain is used for email validation and placeholders throughout the app
NEXT_PUBLIC_DOMAIN="example.com"

# Superadmin Initial Setup
SUPERADMIN_EMAIL="admin@example.com"
SUPERADMIN_PASSWORD="change-this-password"

# Rate Limiting (emails per hour per user)
EMAIL_RATE_LIMIT="100"
```

4. **Set up the database**:
```bash
npx prisma generate
npx prisma db push
```

5. **Initialize the superadmin account**:
```bash
curl -X POST http://localhost:3000/api/init
```

6. **Run the development server**:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment on Vercel

### Step 1: Create Vercel Account
1. Sign up at [vercel.com](https://vercel.com)
2. Install Vercel CLI (optional): `npm i -g vercel`

### Step 2: Set up Vercel Postgres
1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Copy the `DATABASE_URL` connection string
4. Add it to your environment variables

### Step 3: Configure Environment Variables
In your Vercel project settings, add all environment variables from `.env.example`:

```
DATABASE_URL=<your-vercel-postgres-url>
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=<your-vercel-app-url>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your-email>
SMTP_PASS=<your-app-password>
NEXT_PUBLIC_DOMAIN=example.com
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=<secure-password>
EMAIL_RATE_LIMIT=100
```

### Step 4: Deploy

**Option A: Using Git (Recommended)**
1. Push your code to GitHub/GitLab/Bitbucket
2. Import the repository in Vercel
3. Vercel will automatically deploy on each push

**Option B: Using Vercel CLI**
```bash
vercel --prod
```

### Step 5: Initialize Superadmin
After deployment, initialize the superadmin account:
```bash
curl -X POST https://your-app.vercel.app/api/init
```

## Gmail SMTP Setup

### Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification

### Create App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Other (Custom name)"
3. Name it "Email Sender App"
4. Copy the 16-character password
5. Use this as `SMTP_PASS` in your `.env`

### Configure Environment
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-app-password"
```

## Usage Guide

### Superadmin Workflow
1. **Login**: Use credentials from `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD`
2. **Create Users**: Navigate to Admin panel → Create User
3. **Set From Address**: Assign fixed email addresses to users
4. **Manage Users**: Edit or delete user accounts
5. **Send Emails**: Use the compose interface with full control

### Regular User Workflow
1. **Login**: Use credentials provided by superadmin
2. **Compose Email**:
   - Fixed "From" address (cannot be changed)
   - Add To, CC, BCC recipients
   - Write subject and message using rich text editor
   - Add formatting, links, lists, etc.
3. **Send**: Click Send Email button
4. **Track**: View email history and statistics

### Email Composer Features
- **Rich Text Formatting**: Bold, italic, underline, headings
- **Lists**: Bullet points and numbered lists
- **Alignment**: Left, center, right alignment
- **Links**: Add hyperlinks
- **Code**: Code blocks and inline code
- **Multiple Recipients**: Comma-separated email addresses

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `POST /api/init` - Initialize superadmin (one-time)

### Users (SUPERADMIN only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Email
- `POST /api/email/send` - Send email
- `GET /api/email/history` - Get email history
- `GET /api/email/stats` - Get email statistics

## Database Schema

### Users
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  role          UserRole @default(USER)
  fromAddress   String?
  createdBy     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Emails
```prisma
model Email {
  id          String      @id @default(cuid())
  userId      String
  from        String
  replyTo     String?
  to          String[]
  cc          String[]
  bcc         String[]
  subject     String
  bodyHtml    String
  status      EmailStatus
  sentAt      DateTime?
  createdAt   DateTime
}
```

## Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Sessions**: Secure session management
- **Rate Limiting**: Per-user email sending limits
- **Role-Based Access**: Endpoint-level authorization
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM
- **XSS Protection**: HTML sanitization in TipTap

## Performance Optimization

- **Edge Functions**: Optimized for Vercel Edge Network
- **Database Connection Pooling**: Prisma connection management
- **Bundle Optimization**: Next.js automatic code splitting
- **API Route Caching**: Proper cache headers
- **Serverless Functions**: Under 50MB limit

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in environment variables
2. Verify SMTP server allows connections
3. For Gmail, ensure App Password is used (not regular password)
4. Check rate limits in dashboard

### Database Connection Issues
1. Verify `DATABASE_URL` is correct
2. Run `npx prisma generate` after schema changes
3. Check Vercel Postgres connection limits

### Build Failures
1. Ensure all environment variables are set
2. Run `npm install` to update dependencies
3. Check Node.js version (18.17.0+)
4. Clear `.next` folder: `rm -rf .next`

### Superadmin Cannot Login
1. Verify superadmin was initialized: `POST /api/init`
2. Check `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` match
3. Verify database connection

## Development

### Run Development Server
```bash
npm run dev
```

### Database Management
```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Type Checking
```bash
npm run lint
```

## Project Structure

```
smtp-mail-sender/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── email/        # Email endpoints
│   │   ├── users/        # User management
│   │   └── init/         # Superadmin init
│   ├── dashboard/        # Dashboard pages
│   ├── admin/            # Admin panel
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ui/               # UI components
│   ├── EmailComposer.tsx
│   ├── EmailEditor.tsx
│   └── DashboardLayout.tsx
├── lib/                  # Utilities
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth config
│   ├── email.ts          # Email utilities
│   └── rate-limit.ts     # Rate limiting
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static files
```

## Rate Limits (Vercel Free Tier)

- **Serverless Functions**: 100GB-hours/month
- **Edge Functions**: 100,000 requests/day
- **Bandwidth**: 100GB/month
- **Build Time**: 6,000 minutes/month
- **Database**: Vercel Postgres (256MB storage)

## Support

For issues, questions, or contributions:
1. Check existing issues on GitHub
2. Create a new issue with detailed description
3. Include error logs and environment details

## License

MIT License - See LICENSE file for details

## Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [Nodemailer](https://nodemailer.com/)
- [TipTap](https://tiptap.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---
