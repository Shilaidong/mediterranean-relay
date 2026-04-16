// Supabase Edge Function: purchase-album
// Handles album purchase: deduct credits, transfer ownership, create transaction record

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PurchaseRequest {
  albumId: string
  price: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { albumId, price }: PurchaseRequest = await req.json()

    // Get request auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get album details
    const { data: album, error: albumError } = await supabase
      .from('albums')
      .select('*, owner_id')
      .eq('id', albumId)
      .single()

    if (albumError || !album) {
      return new Response(JSON.stringify({ error: 'Album not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user already owns this album
    if (album.owner_id === user.id) {
      return new Response(JSON.stringify({ error: 'You already own this album' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get buyer profile (credits)
    const { data: buyerProfile, error: buyerError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (buyerError || !buyerProfile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if buyer has enough credits
    if (buyerProfile.credits < price) {
      return new Response(JSON.stringify({ error: 'Insufficient credits' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const sellerId = album.owner_id

    // Perform purchase in a transaction-like manner using RPC
    const { data: result, error: purchaseError } = await supabase.rpc('process_purchase', {
      p_buyer_id: user.id,
      p_seller_id: sellerId,
      p_album_id: albumId,
      p_price: price,
    })

    if (purchaseError) {
      console.error('Purchase error:', purchaseError)
      return new Response(JSON.stringify({ error: 'Purchase failed', details: purchaseError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, message: 'Purchase completed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
