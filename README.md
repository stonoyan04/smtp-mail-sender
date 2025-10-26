# SMTP Email Sender

A professional email sending platform built with Next.js 14, featuring role-based access control, rich text editing, and SMTP integration.

## Features
- User authentication with role-based access control
- Rich text email composer with TipTap editor
- Email history and statistics tracking
- Rate limiting per user
- SMTP integration with Nodemailer

## Local Development Setup

### Prerequisites
- Node.js 18.17.0 or higher
- PostgreSQL database
- SMTP credentials (Gmail, SendGrid, etc.)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smtp-mail-sender
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
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
# Used for email validation (user emails must end with this domain)
ALLOWED_EMAIL_DOMAIN="example.com"

# Superadmin Initial Setup
SUPERADMIN_EMAIL="admin@example.com"
SUPERADMIN_PASSWORD="change-this-password"

# Rate Limiting (emails per hour per user)
EMAIL_RATE_LIMIT="100"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Initialize the superadmin account (in a new terminal):
```bash
curl -X POST http://localhost:3000/api/init
```

7. Visit [http://localhost:3000](http://localhost:3000) and login with your superadmin credentials.

## Gmail SMTP Setup (Optional)

1. **Enable 2-Factor Authentication**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Create App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
   - Use this as `SMTP_PASS` in your `.env`

## Additional Commands

```bash
# Open database GUI
npx prisma studio

# Type checking
npm run lint

# Build for production
npm run build
npm start
```

## License

MIT License
