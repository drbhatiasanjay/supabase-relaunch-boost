import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseKey || !lovableApiKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Fetching bookmarks for user:', user.id);

    // Fetch user's bookmarks
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('title, description, tags, category, url')
      .eq('user_id', user.id)
      .limit(100);

    if (bookmarksError) {
      console.error('Error fetching bookmarks:', bookmarksError);
      throw new Error('Failed to fetch bookmarks');
    }

    if (!bookmarks || bookmarks.length === 0) {
      return new Response(
        JSON.stringify({
          interests: ['Start saving bookmarks to unlock personality insights!'],
          topics: [],
          readingPatterns: 'No reading patterns yet - save some bookmarks to get started.',
          personalityTraits: [],
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Analyzing ${bookmarks.length} bookmarks`);

    // Prepare data for AI analysis
    const bookmarkSummary = bookmarks.map(b => ({
      title: b.title,
      description: b.description,
      tags: b.tags,
      category: b.category,
    }));

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a personality analyst. Analyze bookmark collections to provide insightful personality analysis.',
          },
          {
            role: 'user',
            content: `Analyze this user's interests and personality based on their bookmark collection:\n\n${JSON.stringify(bookmarkSummary, null, 2)}\n\nProvide insights about their interests, topics they follow, reading patterns, and personality traits.`,
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'personality_analysis',
              description: 'Return personality analysis based on bookmark collection',
              parameters: {
                type: 'object',
                properties: {
                  interests: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Main interests (3-5 items)',
                  },
                  topics: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Key topics they follow (3-5 items)',
                  },
                  readingPatterns: {
                    type: 'string',
                    description: 'Description of their reading patterns and habits',
                  },
                  personalityTraits: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Personality traits (3-5 items)',
                  },
                },
                required: ['interests', 'topics', 'readingPatterns', 'personalityTraits'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'personality_analysis' } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI service requires payment. Please add credits.');
      }
      
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No analysis returned from AI');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-personality:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
