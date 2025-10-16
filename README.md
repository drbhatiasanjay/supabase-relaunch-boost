# BookmarkHub

A full-stack bookmark management application with AI-powered features and Telegram bot integration.

## 🏗️ Architecture Overview

BookmarkHub consists of four main components:

1. **Web UI** - React/TypeScript frontend with Vite
2. **Supabase Backend** - PostgreSQL database, authentication, and edge functions
3. **Edge Functions** - Serverless functions for AI analysis and webhook handling
4. **Telegram Bot** - Conversational interface for bookmark management

## ✨ Features

### Web Application
- 📚 Bookmark management with rich metadata
- 🏷️ Tag-based organization
- 📁 Folder hierarchy support
- 🔍 Advanced search and filtering
- 📖 Reading list management
- 📊 Statistics dashboard
- 🌓 Dark/Light mode
- 📱 Responsive design
- 📥 Import/Export (JSON, HTML)
- 🔐 Secure authentication (Email, Phone, Google)

### Telegram Bot
- 💬 Natural language bookmark queries
- 🎯 Smart intent detection
- 🧠 AI-powered personality analysis
- 📊 Bookmark statistics
- 🔍 Search by tags, categories, reading status
- 📝 Bookmark recommendations
- 🎲 Random bookmark suggestions

### AI Features
- Personality insights based on bookmark collection
- Reading pattern analysis
- Interest categorization
- Content recommendations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Telegram Bot Token (optional, for bot features)
- Lovable AI API access (for personality analysis)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd bookmarkhub
npm install
```

### 2. Supabase Setup

#### A. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### B. Database Schema

The database schema is automatically managed through migrations in `supabase/migrations/`. The schema includes:

**Tables:**
- `profiles` - User profile information with Telegram ID mapping
- `bookmarks` - Bookmark records with metadata
- `folders` - Hierarchical folder structure
- `tags` - User-defined tags with colors

**Key Features:**
- Row Level Security (RLS) enabled on all tables
- Automatic timestamp management
- User profile auto-creation on signup
- Foreign key relationships with cascade deletes

Run migrations:
```bash
# If using Supabase CLI
supabase db push
```

#### C. Authentication Providers

Configure in Supabase Dashboard → Authentication → Providers:
- Email (enabled by default)
- Phone (optional)
- Google OAuth (optional)

### 3. Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### 4. Edge Functions Setup

#### A. Required Secrets

Set these in Supabase Dashboard → Edge Functions → Manage Secrets:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
LOVABLE_API_KEY=your_lovable_ai_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

#### B. Deploy Edge Functions

Edge functions are automatically deployed with the project. The following functions are available:

**1. chat-webhook** (`/functions/v1/chat-webhook`)
- Handles Telegram bot interactions
- Processes natural language queries
- Intent detection and routing
- AI-powered personality analysis

**2. fetch-bookmark-metadata** (`/functions/v1/fetch-bookmark-metadata`)
- Extracts metadata from URLs
- Fetches title, description, and tags
- Used when adding new bookmarks

**3. analyze-personality** (`/functions/v1/analyze-personality`)
- Analyzes user's bookmark collection
- Generates personality insights
- Identifies interests and reading patterns

#### C. Function Configuration

Edit `supabase/config.toml` to configure function settings:

```toml
project_id = "your_project_id"

[functions.chat-webhook]
verify_jwt = false  # Public endpoint for Telegram webhooks

[functions.analyze-personality]
verify_jwt = true  # Requires authentication

[functions.fetch-bookmark-metadata]
verify_jwt = true  # Requires authentication
```

### 5. Telegram Bot Setup

#### A. Create Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow instructions
3. Save the bot token

#### B. Link User Accounts

Users need to connect their Telegram account:

1. Sign up on the web application
2. Go to Settings
3. Enter Telegram ID (can be found using [@userinfobot](https://t.me/userinfobot))
4. Save profile

The bot will now recognize the user and can access their bookmarks.

#### C. Set Webhook

Set up the webhook to point to your edge function:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-project.supabase.co/functions/v1/chat-webhook"
  }'
```

#### D. Bot Commands

The bot supports natural language queries:

**Bookmark Queries:**
- "Show me React bookmarks"
- "What are my unread bookmarks?"
- "Show me bookmarks about AI"
- "How many bookmarks do I have?"

**Analysis:**
- "Tell me about my personality"
- "Who am I?"
- "Analyze my interests"
- "Summarize my collection"

**Recommendations:**
- "Recommend something to read"
- "What should I read?"
- "I'm bored" (gets random bookmark)

**Tags & Stats:**
- "What are my most common tags?"
- "Show my statistics"

### 6. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
bookmarkhub/
├── src/
│   ├── components/        # React components
│   │   ├── dashboard/     # Dashboard-specific components
│   │   └── ui/            # Shadcn UI components
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # Supabase client setup
│   ├── lib/               # Utility functions
│   ├── pages/             # Page components
│   └── index.css          # Global styles & design tokens
├── supabase/
│   ├── functions/         # Edge functions
│   │   ├── chat-webhook/
│   │   ├── fetch-bookmark-metadata/
│   │   └── analyze-personality/
│   ├── migrations/        # Database migrations
│   └── config.toml        # Supabase configuration
└── tests/                 # Playwright tests
```

## 🗄️ Database Schema

### profiles
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `email` (text)
- `phone_number` (text, nullable)
- `telegram_id` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### bookmarks
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `folder_id` (uuid, FK to folders, nullable)
- `title` (text)
- `url` (text)
- `description` (text, nullable)
- `category` (text, nullable)
- `tags` (text[], default: [])
- `read` (boolean, default: false)
- `reading` (boolean, default: false)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### folders
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `parent_id` (uuid, FK to folders, nullable)
- `name` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### tags
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users)
- `name` (text)
- `color` (text, nullable)
- `created_at` (timestamp)

## 🔐 Security

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only view/edit their own data
- Profiles automatically created on signup
- Cascade deletes maintain referential integrity

### Authentication Flow

1. User signs up via email/phone/Google
2. Trigger creates profile record automatically
3. JWT token issued for API authentication
4. Frontend uses Supabase client for authenticated requests

## 🧪 Testing

The project includes comprehensive Playwright tests:

```bash
# Install Playwright browsers
npx playwright install

# Run all tests
npx playwright test

# Run specific test suite
npx playwright test tests/bookmarks.spec.ts

# Run tests with UI
npx playwright test --ui
```

**Test Coverage:**
- Authentication flows
- Bookmark CRUD operations
- Search and filtering
- Import/Export functionality
- View modes and sorting

## 🔧 N8N Integration (Optional)

N8N workflows can be integrated for advanced automation:

### Use Cases
- Automated bookmark backup to cloud storage
- Scheduled bookmark reports
- Integration with other services (Notion, Slack, etc.)
- Automated tagging based on content analysis

### Setup

1. Install N8N:
```bash
npm install n8n -g
n8n start
```

2. Create a workflow that:
   - Connects to Supabase (use HTTP Request nodes)
   - Authenticates with service role key
   - Queries/updates bookmark data
   - Triggers on schedule or webhook

3. Example workflow nodes:
   - **Trigger:** Schedule/Webhook
   - **Supabase Query:** HTTP Request to REST API
   - **Processing:** Function node for data transformation
   - **Action:** HTTP Request to update records

### Supabase REST API Access

```javascript
// N8N HTTP Request Node Configuration
Method: GET
URL: https://your-project.supabase.co/rest/v1/bookmarks
Headers:
  - apikey: YOUR_ANON_KEY
  - Authorization: Bearer YOUR_SERVICE_ROLE_KEY
  - Content-Type: application/json
```

## 🚀 Deployment

### Deploy Web App

The project is configured for deployment on Lovable:

1. Click "Publish" in Lovable editor
2. Your app is deployed automatically
3. Custom domain can be configured in project settings

### Manual Deployment (Vercel/Netlify)

```bash
# Build for production
npm run build

# Preview locally
npm run preview
```

Deploy the `dist` folder to your hosting platform.

### Environment Variables (Production)

Set these in your hosting platform:
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## 📊 AI Features Configuration

### Lovable AI Models

The application uses Lovable AI for personality analysis:

- **Model:** `google/gemini-2.5-flash` (default)
- **Fallback:** Automatic retry with exponential backoff
- **Rate Limits:** Handled with graceful error messages

### Customizing AI Prompts

Edit `supabase/functions/chat-webhook/index.ts` to customize:

```typescript
const systemPrompt = `
  You are an intelligent bookmark assistant.
  Analyze the user's bookmarks and provide insights...
`;
```

## 🐛 Troubleshooting

### Common Issues

**1. Telegram Bot Not Responding**
- Verify webhook is set correctly
- Check edge function logs in Supabase Dashboard
- Ensure `TELEGRAM_BOT_TOKEN` secret is set
- Verify user has linked Telegram ID in profile

**2. Personality Analysis Fails**
- Check `LOVABLE_API_KEY` is set
- Verify user has bookmarks (minimum 1 required)
- Check edge function logs for AI API errors

**3. Authentication Issues**
- Verify environment variables are set correctly
- Check RLS policies in Supabase Dashboard
- Ensure email confirmation is disabled for testing (or configure email provider)

**4. Bookmarks Not Saving**
- Check browser console for errors
- Verify RLS policies allow INSERT
- Check user is authenticated

### Debug Logs

View edge function logs:
```bash
# Supabase Dashboard → Edge Functions → Function Name → Logs
```

View Postgres logs:
```bash
# Supabase Dashboard → Database → Logs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

[Your License Here]

## 🔗 Links

- [Supabase Documentation](https://supabase.com/docs)
- [Lovable AI Documentation](https://docs.lovable.dev/features/ai)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [N8N Documentation](https://docs.n8n.io)

## 💡 Tips

- Use the bookmarklet for quick bookmark saving (see Dashboard)
- Import existing bookmarks from browser
- Tag bookmarks for better organization
- Use Telegram bot for quick lookups on mobile
- Regular backups via Export feature

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check Lovable Discord community
- Review Supabase documentation

---

Built with ❤️ using Lovable, Supabase, and React
