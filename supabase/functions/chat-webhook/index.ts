import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatRequest {
  phone: string;
  message: string;
}

interface Intent {
  type: 'reading_list' | 'add_link' | 'search' | 'chat' | 'bored' | 'unknown';
  query?: string;
  url?: string;
  tags?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { phone, message }: ChatRequest = await req.json();
    
    console.log('Received chat message:', { phone, message });

    // 1. Map phone/telegram_id to user
    // First try telegram_id, then phone_number
    let profile = null;
    let profileError = null;

    // Try telegram_id first (for Telegram integration)
    const { data: telegramProfile, error: telegramError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('telegram_id', phone)
      .maybeSingle();

    if (telegramProfile) {
      profile = telegramProfile;
    } else {
      // Fallback to phone_number (for WhatsApp or SMS)
      const { data: phoneProfile, error: phoneError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone_number', phone)
        .maybeSingle();
      
      profile = phoneProfile;
      profileError = phoneError;
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ 
          reply: "📱 Not registered. Please add your Telegram ID or phone number in your profile settings.\n\nYour Telegram ID: " + phone 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = profile.user_id;
    console.log('Mapped phone to user:', userId);

    // 2. Parse intent
    const intent = parseIntent(message);
    console.log('Parsed intent:', intent);

    // 3. Handle intent
    let reply = '';
    
    switch (intent.type) {
      case 'reading_list':
        reply = await getReadingList(supabase, userId);
        break;
      case 'add_link':
        reply = await addBookmark(supabase, userId, intent.url!, intent.query);
        break;
      case 'search':
        reply = await searchBookmarks(supabase, userId, intent.query!);
        break;
      case 'bored':
        reply = await suggestBookmark(supabase, userId);
        break;
      case 'chat':
        reply = await chatAboutBookmarks(supabase, userId, message);
        break;
      default:
        reply = "🤔 I can help you with:\n\n📚 *reading list* - Show your reading list\n🔗 *add [url]* - Add a bookmark\n🔍 *search [text]* - Search bookmarks\n😴 *I'm bored* - Get a random suggestion\n💬 *Ask me anything* - Chat about your bookmarks!";
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
    console.error('Error:', error);
    const response = { reply: "Sorry, I encountered an error processing your request." };
    console.log('Sending response:', response);
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 so n8n can deliver the message
      }
    );
  }
});

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

  // Add link intent
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const urlMatch = message.match(urlRegex);
  if (lowerMessage.includes('add') && urlMatch) {
    const url = urlMatch[1];
    const description = message.replace(urlMatch[0], '').replace(/add/i, '').trim();
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

  // If it's a question or conversational message, treat as chat
  if (chatKeywords.some(keyword => lowerMessage.includes(keyword))) {
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

  // For multi-word messages that aren't commands, default to chat
  if (wordCount > 2 && !lowerMessage.startsWith('#')) {
    return { type: 'chat' };
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

  console.log(`Reading list query user=${userId} count=${bookmarks?.length ?? 0}`);

  if (!bookmarks || bookmarks.length === 0) {
    console.log('Reading list is empty for user:', userId);
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
    const title = description || urlObj.hostname;

    const { error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        url: url,
        title: title,
        description: description || null,
        reading: false
      });

    if (error) {
      console.error('Error adding bookmark:', error);
      return "❌ Failed to add bookmark";
    }

    return `✅ *Bookmark added!*\n\n${title}\n${url}`;
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
