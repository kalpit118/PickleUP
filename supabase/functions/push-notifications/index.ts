import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const vapidPublicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY')
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:hello@pickleup.com',
    vapidPublicKey,
    vapidPrivateKey
  )
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Ensure the user calling this function is authenticated
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { target_user_id, title, body, data, actions } = await req.json()

    if (!target_user_id) throw new Error('target_user_id is required')

    // Get all subscriptions for the target user
    const { data: subscriptions, error } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', target_user_id)

    if (error) throw error

    const payload = JSON.stringify({
      title,
      body,
      data,
      actions
    })

    const notifications = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }
      
      try {
        await webpush.sendNotification(pushSubscription, payload)
      } catch (e: any) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          // Subscription has expired or is no longer valid, clean it up from DB
          await supabaseClient.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        } else {
          console.error('Error sending push notification to endpoint:', sub.endpoint, e)
        }
      }
    })

    await Promise.all(notifications)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
