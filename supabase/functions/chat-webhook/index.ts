import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Basic per-user rate limiting (in-memory)
// Window: 60 seconds, Max: 60 requests
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;
const rlStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string) {
  const now = Date.now();
  const entry = rlStore.get(key);
  if (!entry || now > entry.resetAt) {
    rlStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt };
}

interface ChatRequest {
  message: string;
  phone?: string;
  telegram_id?: string;
}

interface Intent {
  type: 'reading_list' | 'add_link' | 'search' | 'chat' | 'bored' | 'unknown';
  query?: string;
  url?: string;
  tags?: string[];
}

// Input validation schema
const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message required").max(1000, "Message too long"),
  phone: z.string().trim().max(32).optional(),
  telegram_id: z.string().trim().max(64).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? '',
        },
      },
    });

    // Parse and validate input with better error handling
    let rawBody;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      console.log('Content-Type:', req.headers.get('content-type'));
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('Empty request body received');
        return new Response(
          JSON.stringify({ reply: "❌ Empty request received" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      rawBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError instanceof Error ? parseError.message : 'Unknown');
      return new Response(
        JSON.stringify({ reply: "❌ Invalid JSON format in request" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check if this is a Telegram webhook format
    let chatRequest: ChatRequest;
    if (rawBody.message && typeof rawBody.message === 'object' && rawBody.message.text) {
      // Telegram webhook format: { update_id, message: { text, from: { id }, chat: {...} } }
      console.log('Detected Telegram webhook format');
      chatRequest = {
        message: rawBody.message.text,
        telegram_id: String(rawBody.message.from?.id || rawBody.message.chat?.id)
      };
    } else {
      // Standard format: { message, phone?, telegram_id? }
      const validationResult = chatRequestSchema.safeParse(rawBody);
      
      if (!validationResult.success) {
        console.log('Validation failed:', validationResult.error.errors[0].message);
        return new Response(
          JSON.stringify({ 
            reply: `❌ Invalid request: ${validationResult.error.errors[0].message}` 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      chatRequest = validationResult.data;
    }

    const { message, phone, telegram_id } = chatRequest;
    console.log('Chat request received');

    // Use service role to map phone/telegram_id to user
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not set');
      return new Response(
        JSON.stringify({ reply: "Server misconfiguration. Try again later." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    const serviceClient = createClient(supabaseUrl, serviceKey);

    if (!phone && !telegram_id) {
      return new Response(
        JSON.stringify({ reply: "Unauthorized: missing identifier (phone/telegram_id)." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    let profileRes;
    if (phone) {
      profileRes = await serviceClient
        .from('profiles')
        .select('user_id')
        .eq('phone_number', phone)
        .maybeSingle();
    } else {
      profileRes = await serviceClient
        .from('profiles')
        .select('user_id')
        .eq('telegram_id', telegram_id!)
        .maybeSingle();
    }

    if (profileRes.error || !profileRes.data) {
      console.error('Profile lookup failed:', profileRes.error || 'not found');
      return new Response(
        JSON.stringify({ reply: "❌ User not found for provided identifier." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const userId = profileRes.data.user_id as string;
    console.log('Mapped identifier to user:', userId);

    // Rate limiting per user
    const rl = checkRateLimit(userId);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ reply: "Too many requests. Please slow down." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    // 2. Parse intent
    const intent = parseIntent(message);
    console.log('Parsed intent:', intent);

    // 3. Handle intent
    let reply = '';
    
    switch (intent.type) {
      case 'reading_list':
        reply = await getReadingList(serviceClient, userId);
        break;
      case 'add_link':
        reply = await addBookmark(serviceClient, userId, intent.url!, intent.query);
        break;
      case 'search':
        reply = await searchBookmarks(serviceClient, userId, intent.query!);
        break;
      case 'bored':
        reply = await suggestBookmark(serviceClient, userId);
        break;
      case 'chat':
        reply = await chatAboutBookmarks(serviceClient, userId, message);
        break;
      default:
        reply = "🔖 *I'm your Bookmark Assistant!*\n\nI can only help with questions about your saved bookmarks, links, and reading materials.\n\n*What I can do:*\n📚 Show your reading list\n🔗 Add bookmarks\n🔍 Search your saved links\n💡 Recommend articles to read\n📊 Analyze your collection\n🏷️ Help with tags and organization\n\n*Try asking:*\n• \"Show me React tutorials\"\n• \"What should I read next?\"\n• \"How many bookmarks do I have?\"\n• \"Summarize my collection\"\n\nPlease ask something related to your bookmarks! 😊";
    }

    // Return only 'reply' field for n8n/Telegram compatibility
    const response = { reply };
    console.log('Sending response with reply length:', reply.length);
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Request processing error:', error instanceof Error ? error.message : 'Unknown error');
    const response = { reply: "Sorry, I encountered an error processing your request." };
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 so n8n can deliver the message
      }
    );
  }
});

function isBookmarkRelated(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  
  // Bookmark-specific keywords that indicate valid queries
  const bookmarkKeywords = [
    'bookmark', 'link', 'save', 'saved', 'article', 'reading list', 'read',
    'tutorial', 'resource', 'tag', 'folder', 'collection', 'organize',
    'learn', 'study', 'framework', 'library', 'documentation', 'docs',
    'web development', 'programming', 'code', 'coding', 'tech',
    'react', 'vue', 'angular', 'node', 'python', 'javascript', 'typescript',
    'css', 'html', 'my bookmarks', 'my links', 'my collection', 'my saves'
  ];
  
  // Off-topic patterns that should be rejected
  const offTopicPatterns = [
    // General knowledge questions
    /capital of/i, /president of/i, /king of/i, /queen of/i,
    /population of/i, /currency of/i, /language of/i,
    // General "who" questions (unless about saved content)
    /^who (is|was|are|were)(?!.*\b(saved|bookmark|link)\b)/i,
    // Weather, time, math, etc.
    /weather/i, /temperature/i, /time in/i, /\d+\s*[\+\-\*\/]\s*\d+/,
    // Personal questions unrelated to bookmarks
    /how old are you/i, /who made you/i, /what are you/i,
    // Random greetings without context
    /^(hi|hello|hey|sup)$/i,
  ];
  
  // Check for off-topic patterns first
  if (offTopicPatterns.some(pattern => pattern.test(message))) {
    return false;
  }
  
  // If message contains bookmark keywords, it's valid
  if (bookmarkKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return true;
  }
  
  // If message has a URL, it's likely bookmark-related
  if (/(https?:\/\/[^\s]+)/.test(message)) {
    return true;
  }
  
  // If it's a very short message without context, be strict
  const wordCount = lowerMessage.split(/\s+/).length;
  if (wordCount <= 3 && !lowerMessage.includes('?')) {
    // Single words or short phrases need to be tech-related
    const techTerms = [
      'react', 'vue', 'angular', 'node', 'python', 'java', 'ruby', 'php', 'swift',
      'css', 'html', 'javascript', 'typescript', 'nextjs', 'tailwind', 'prisma',
      'github', 'gitlab', 'stackoverflow', 'mdn', 'w3schools'
    ];
    return techTerms.some(term => lowerMessage.includes(term));
  }
  
  // For questions, check if they're about personal collection
  if (lowerMessage.includes('?')) {
    const collectionQuestions = [
      'what', 'how many', 'which', 'do i have', 'did i save', 'should i',
      'can you show', 'tell me about', 'summarize', 'topics', 'most common'
    ];
    return collectionQuestions.some(q => lowerMessage.includes(q));
  }
  
  // Default to false for safety
  return false;
}

function parseIntent(message: string): Intent {
  const lowerMessage = message.toLowerCase().trim();

  // Bored intent - check first before other intents
  if (lowerMessage.includes('bored') || lowerMessage.includes('bore')) {
    return { type: 'bored' };
  }

  // Reading list intent
  if (lowerMessage.includes('reading list') || lowerMessage.includes('show reading') || lowerMessage === 'reading') {
    return { type: 'reading_list' };
  }

  // Add link intent - accept "add <url>" OR plain URLs
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const urlMatch = message.match(urlRegex);
  if (urlMatch) {
    const url = urlMatch[1];
    // If message starts with "add", strip it out
    let description = message.replace(urlMatch[0], '').replace(/add/i, '').trim();
    // If no description remains (just a plain URL), set empty
    if (!description || description === url) {
      description = '';
    }
    return { type: 'add_link', url, query: description };
  }

  // Search intent - only for explicit "search" or "find" commands with content
  if ((lowerMessage.startsWith('search ') || lowerMessage.startsWith('find ')) && lowerMessage.length > 7) {
    const query = message.replace(/^(search|find)\s+/i, '').trim();
    return { type: 'search', query };
  }

  // Expanded chat keywords for better conversational detection
  const chatKeywords = [
    '?', 'what', 'why', 'how', 'when', 'where', 'who', 'which',
    'recommend', 'suggest', 'tell me', 'show me', 'do i', 'did i', 'can you',
    'summarize', 'summarise', 'summerise', // Common misspellings
    'learn', 'topics', 'about', 'framework', 'articles', 'resources',
    'should i', 'help', 'any', 'have i', 'my bookmarks', 'my collection'
  ];

  // Check if message is bookmark-related before routing to chat
  if (chatKeywords.some(keyword => lowerMessage.includes(keyword))) {
    // Validate that it's actually about bookmarks
    if (!isBookmarkRelated(message)) {
      return { type: 'unknown' };
    }
    return { type: 'chat' };
  }

  // Single word technical terms should go to chat (not search)
  const techTerms = [
    'react', 'vue', 'angular', 'node', 'python', 'java', 'ruby', 'php', 'swift',
    'css', 'html', 'javascript', 'typescript', 'nextjs', 'tailwind', 'prisma'
  ];
  const wordCount = lowerMessage.split(/\s+/).length;
  if (wordCount === 1 && techTerms.includes(lowerMessage)) {
    return { type: 'chat' };
  }

  // For multi-word messages that aren't commands, check if bookmark-related
  if (wordCount > 2 && !lowerMessage.startsWith('#')) {
    if (isBookmarkRelated(message)) {
      return { type: 'chat' };
    }
  }

  return { type: 'unknown' };
}

async function getReadingList(supabase: any, userId: string): Promise<string> {
  const startTime = Date.now();
  
  // Optimized: Use indexed columns only
  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select('title, url, tags')
    .eq('user_id', userId)
    .eq('reading', true)
    .order('created_at', { ascending: false })
    .limit(5);

  const duration = Date.now() - startTime;
  console.log(`✅ Reading list fetched in ${duration}ms`);

  if (error) {
    console.error('Error fetching reading list:', error);
    return "❌ Error fetching reading list";
  }

  console.log(`Reading list query completed, count=${bookmarks?.length ?? 0}`);

  if (!bookmarks || bookmarks.length === 0) {
    console.log('Reading list is empty');
    return "📚 Your reading list is empty.\n\nMark some bookmarks for reading from the dashboard!";
  }

  let reply = `📚 *Reading List* (${bookmarks.length} bookmark${bookmarks.length > 1 ? 's' : ''})\n\n`;
  bookmarks.forEach((b: any, i: number) => {
    const tags = b.tags?.slice(0, 2).map((t: string) => `#${t}`).join(' ') || '';
    reply += `${i + 1}. ${b.title}\n${b.url}\n${tags}\n\n`;
  });

  return reply.trim();
}

async function addBookmark(supabase: any, userId: string, url: string, description?: string): Promise<string> {
  try {
    // Extract title from URL
    const urlObj = new URL(url);
    
    // Check if bookmark already exists
    const { data: existing, error: existingError } = await supabase
      .from('bookmarks')
      .select('title, url')
      .eq('user_id', userId)
      .eq('url', url)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing bookmark:', existingError);
    }

    if (existing) {
      console.log(`⚠️ Duplicate bookmark detected: ${existing.url}`);
      return `⚠️ *Bookmark already exists!*\n\n${existing.title}\n${existing.url}`;
    }

    // Fetch metadata using Perplexity API
    let metadata = { title: '', description: '', tags: [] };
    try {
      const { data: metadataResult, error: metadataError } = await supabase.functions.invoke('fetch-bookmark-metadata', {
        body: { url }
      });

      if (!metadataError && metadataResult) {
        metadata = metadataResult;
        console.log('Fetched metadata:', metadata);
      }
    } catch (metadataErr) {
      console.error('Error fetching metadata:', metadataErr);
      // Continue with basic data if metadata fetch fails
    }

    // Use fetched metadata or fallback to basic values
    const title = metadata.title || description || urlObj.hostname;
    const finalDescription = metadata.description || description || null;
    const tags = metadata.tags || [];

    const { error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        url: url,
        title: title,
        description: finalDescription,
        tags: tags,
        reading: false
      });

    if (error) {
      console.error('Error adding bookmark:', error);
      return "❌ Failed to add bookmark";
    }

    const tagString = tags.length > 0 ? '\n🏷️ ' + tags.slice(0, 3).map((t: string) => `#${t}`).join(' ') : '';
    return `✅ *Bookmark added!*\n\n${title}\n${url}${tagString}`;
  } catch (error) {
    console.error('Invalid URL:', error);
    return "❌ Invalid URL. Please provide a valid link.";
  }
}

async function searchBookmarks(supabase: any, userId: string, query: string): Promise<string> {
  const startTime = Date.now();
  const isTagSearch = query.startsWith('#');
  const searchTerm = isTagSearch ? query.substring(1) : query;

  // Optimized: Use indexed columns, limit columns selected
  let dbQuery = supabase
    .from('bookmarks')
    .select('title, url, tags')
    .eq('user_id', userId)
    .limit(5);

  if (isTagSearch) {
    // Uses GIN index on tags
    dbQuery = dbQuery.contains('tags', [searchTerm]);
  } else {
    // Uses full-text search index
    dbQuery = dbQuery.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,url.ilike.%${searchTerm}%`);
  }

  const { data: bookmarks, error } = await dbQuery;
  
  const duration = Date.now() - startTime;
  console.log(`✅ Search completed in ${duration}ms for query: "${query}"`);

  if (error) {
    console.error('Error searching bookmarks:', error);
    return "❌ Search failed";
  }

  if (!bookmarks || bookmarks.length === 0) {
    return `🔍 No results for "${query}"`;
  }

  let reply = `🔍 *Search: "${query}"* (${bookmarks.length})\n\n`;
  bookmarks.forEach((b: any, i: number) => {
    const tags = b.tags?.slice(0, 2).map((t: string) => `#${t}`).join(' ') || '';
    reply += `${i + 1}. ${b.title}\n${b.url}\n${tags}\n\n`;
  });

  return reply.trim();
}

async function suggestBookmark(supabase: any, userId: string): Promise<string> {
  try {
    // Get a random bookmark from reading list first, then any bookmark
    const { data: readingBookmarks } = await supabase
      .from('bookmarks')
      .select('title, url, description, tags')
      .eq('user_id', userId)
      .eq('reading', true)
      .limit(10);

    const { data: allBookmarks } = await supabase
      .from('bookmarks')
      .select('title, url, description, tags')
      .eq('user_id', userId)
      .limit(20);

    const bookmarks = readingBookmarks?.length > 0 ? readingBookmarks : allBookmarks;

    if (!bookmarks || bookmarks.length === 0) {
      return "📚 You don't have any bookmarks yet!\n\nAdd some links to get personalized suggestions when you're bored.";
    }

    // Pick a random bookmark
    const randomIndex = Math.floor(Math.random() * bookmarks.length);
    const bookmark = bookmarks[randomIndex];
    
    const tags = bookmark.tags?.slice(0, 3).map((t: string) => `#${t}`).join(' ') || '';
    
    return `✨ *Here's something for you:*\n\n${bookmark.title}\n${bookmark.url}\n${tags}\n\n${bookmark.description ? bookmark.description : 'Enjoy! 🎯'}`;
    
  } catch (error) {
    console.error('Error suggesting bookmark:', error);
    return "❌ Could not fetch a suggestion";
  }
}

async function chatAboutBookmarks(supabase: any, userId: string, message: string): Promise<string> {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not set');
      return "❌ AI chat is not configured. Please contact support.";
    }

    // Fetch user's bookmarks for context
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select('title, url, description, tags, category, reading')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching bookmarks for chat:', error);
      return "❌ Could not retrieve your bookmarks";
    }

    // Build context from bookmarks
    const bookmarksContext = bookmarks?.map((b: any, i: number) => 
      `${i + 1}. ${b.title}${b.description ? ' - ' + b.description : ''}\n   URL: ${b.url}\n   Tags: ${b.tags?.join(', ') || 'none'}\n   ${b.reading ? '📚 Reading list' : ''}`
    ).join('\n\n') || 'No bookmarks saved yet.';

    const systemPrompt = `You are a helpful assistant for a bookmark manager. The user can save bookmarks and you help them find, organize, and discover insights from their saved links.

User's bookmarks (most recent first):
${bookmarksContext}

Provide helpful, concise answers about their bookmarks. Be conversational and friendly. Use emojis where appropriate.`;

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return "⏳ AI is temporarily busy. Please try again in a moment.";
      }
      if (response.status === 402) {
        return "💳 AI credits depleted. Please contact support.";
      }
      
      return "❌ AI chat temporarily unavailable";
    }

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content;

    if (!aiReply) {
      console.error('No AI reply in response:', data);
      return "❌ Could not generate a response";
    }

    return `🤖 *AI Assistant*\n\n${aiReply}`;

  } catch (error) {
    console.error('Error in chatAboutBookmarks:', error);
    return "❌ Error communicating with AI";
  }
}
