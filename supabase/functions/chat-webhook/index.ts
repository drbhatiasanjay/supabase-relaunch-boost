import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ChatRequest {
  message: string;
  phone?: string;
  telegram_id?: string;
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
    const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL');
    if (!N8N_WEBHOOK_URL) {
      console.error('N8N_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ reply: "Server misconfiguration. N8N webhook not configured." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse and validate input
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
    console.log('Chat request received:', { message, phone: phone ? 'set' : 'unset', telegram_id: telegram_id ? 'set' : 'unset' });

    if (!phone && !telegram_id) {
      return new Response(
        JSON.stringify({ reply: "Unauthorized: missing identifier (phone/telegram_id)." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Forward to N8N webhook
    console.log('Forwarding to N8N webhook...');
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        phone,
        telegram_id,
      }),
    });

    if (!n8nResponse.ok) {
      console.error('N8N webhook error:', n8nResponse.status, await n8nResponse.text());
      return new Response(
        JSON.stringify({ reply: "Sorry, I couldn't process your request right now. Please try again later." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const n8nData = await n8nResponse.json();
    console.log('N8N response received:', n8nData);
    
    // Extract reply from N8N response
    const reply = n8nData.reply || n8nData.message || "I received your message but couldn't generate a response.";

    // Send message to Telegram if it's a Telegram request
    if (telegram_id) {
      const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
      if (TELEGRAM_BOT_TOKEN) {
        try {
          console.log('Sending response to Telegram...');
          const telegramResponse = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: telegram_id,
                text: reply,
              }),
            }
          );
          
          if (!telegramResponse.ok) {
            const errorData = await telegramResponse.text();
            console.error('Telegram API error:', telegramResponse.status, errorData);
          } else {
            console.log('✅ Message sent to Telegram successfully');
          }
        } catch (telegramError) {
          console.error('Error sending to Telegram:', telegramError);
        }
      } else {
        console.warn('TELEGRAM_BOT_TOKEN not configured - cannot send to Telegram');
      }
    }

    // Return N8N's response
    return new Response(
      JSON.stringify({ reply }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Request processing error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ reply: "Sorry, I encountered an error processing your request." }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
