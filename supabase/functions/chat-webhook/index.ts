import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  phone: string;
  message: string;
}

interface Intent {
  type: 'reading_list' | 'add_link' | 'search' | 'unknown';
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
      default:
        reply = "🤔 I can help you with:\n\n📚 *reading list* - Show your reading list\n🔗 *add [url]* - Add a bookmark\n🔍 *search [text]* - Search bookmarks";
    }

    return new Response(
      JSON.stringify({ reply }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        reply: "❌ Sorry, something went wrong. Please try again." 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function parseIntent(message: string): Intent {
  const lowerMessage = message.toLowerCase().trim();

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

  // Search intent
  if (lowerMessage.startsWith('search ') || lowerMessage.startsWith('find ')) {
    const query = message.replace(/^(search|find)\s+/i, '').trim();
    return { type: 'search', query };
  }

  // Tag search
  if (lowerMessage.startsWith('#')) {
    return { type: 'search', query: lowerMessage };
  }

  return { type: 'unknown' };
}

async function getReadingList(supabase: any, userId: string): Promise<string> {
  const startTime = Date.now();
  
  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select('title, url, tags')
    .eq('user_id', userId)
    .eq('reading', true)
    .order('created_at', { ascending: false })
    .limit(5);

  const duration = Date.now() - startTime;
  console.log(`Reading list fetched in ${duration}ms`);

  if (error) {
    console.error('Error fetching reading list:', error);
    return "❌ Error fetching reading list";
  }

  if (!bookmarks || bookmarks.length === 0) {
    return "📚 Your reading list is empty.\n\nAdd bookmarks to your reading list from the dashboard!";
  }

  let reply = `📚 *Reading List* (${bookmarks.length})\n\n`;
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
  const isTagSearch = query.startsWith('#');
  const searchTerm = isTagSearch ? query.substring(1) : query;

  let dbQuery = supabase
    .from('bookmarks')
    .select('title, url, tags')
    .eq('user_id', userId)
    .limit(5);

  if (isTagSearch) {
    dbQuery = dbQuery.contains('tags', [searchTerm]);
  } else {
    dbQuery = dbQuery.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,url.ilike.%${searchTerm}%`);
  }

  const { data: bookmarks, error } = await dbQuery;

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
