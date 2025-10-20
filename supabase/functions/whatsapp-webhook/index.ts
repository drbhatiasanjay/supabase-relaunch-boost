import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  from: string;
  text: { body: string };
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // WhatsApp webhook verification (GET) must run before reading body
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === Deno.env.get('WHATSAPP_VERIFY_TOKEN')) {
        console.log('Webhook verified');
        return new Response(challenge, { status: 200 });
      }
      return new Response('Forbidden', { status: 403 });
    }

    const body = await req.json();
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));

    // Extract message from WhatsApp webhook payload
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0] as WhatsAppMessage;

    if (!message) {
      console.log('No message found in webhook payload');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const phoneNumber = message.from;
    const messageText = message.text?.body;

    if (!phoneNumber || !messageText) {
      console.log('Missing phone number or message text');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing message from ${phoneNumber}: ${messageText}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process the message using chat-webhook logic
    const { data: chatResponse, error: chatError } = await supabase.functions.invoke('chat-webhook', {
      body: {
        phone: phoneNumber,
        message: messageText,
      },
    });

    if (chatError) {
      console.error('Error calling chat-webhook:', chatError);
      throw chatError;
    }

    const reply = chatResponse?.reply || "I couldn't process your request.";
    console.log('Chat response:', reply);

    // Send reply back via WhatsApp
    const { error: sendError } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        to: phoneNumber,
        message: reply,
        type: 'text',
      },
    });

    if (sendError) {
      console.error('Error sending WhatsApp reply:', sendError);
    } else {
      console.log('Reply sent successfully');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in whatsapp-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
