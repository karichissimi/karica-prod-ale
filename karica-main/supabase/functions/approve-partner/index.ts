import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user token to verify they're admin
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.log('User auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin using service role
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      console.log('User is not admin:', user.id);
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { requestId, action } = await req.json();
    console.log('Processing request:', { requestId, action, adminId: user.id });

    if (!requestId || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the partner request
    const { data: request, error: requestError } = await supabaseAdmin
      .from('partner_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.log('Request not found:', requestError);
      return new Response(JSON.stringify({ error: 'Request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (request.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Request already processed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'approve') {
      // 1. Assign partner role to user
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: request.user_id, role: 'partner' });

      if (roleError) {
        console.log('Error assigning role:', roleError);
        return new Response(JSON.stringify({ error: 'Failed to assign role' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 2. Create partner profile with partner_type
      const partnerType = request.partner_type || 'intervention';
      console.log('Creating partner with type:', partnerType);
      
      const { data: partner, error: partnerError } = await supabaseAdmin
        .from('partners')
        .insert({
          id: request.user_id,
          user_id: request.user_id,
          company_name: request.company_name,
          contact_email: request.contact_email,
          contact_phone: request.contact_phone,
          description: request.description,
          partner_type: partnerType,
          is_active: true,
        })
        .select()
        .single();

      if (partnerError) {
        console.log('Error creating partner:', partnerError);
        // Rollback role assignment
        await supabaseAdmin.from('user_roles').delete().eq('user_id', request.user_id).eq('role', 'partner');
        return new Response(JSON.stringify({ error: 'Failed to create partner profile' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 3. Create type-specific records based on partner_type
      if (partnerType === 'cer_president') {
        // Create CER manager record
        const { error: cerError } = await supabaseAdmin
          .from('cer_managers')
          .insert({
            partner_id: partner.id,
            role: 'president',
          });
        
        if (cerError) {
          console.log('Warning: Failed to create CER manager record:', cerError);
        } else {
          console.log('CER manager record created for partner:', partner.id);
        }
      } else if (partnerType === 'marketplace') {
        // Create marketplace partner record
        const { error: marketplaceError } = await supabaseAdmin
          .from('marketplace_partners')
          .insert({
            partner_id: partner.id,
            store_name: request.company_name,
          });
        
        if (marketplaceError) {
          console.log('Warning: Failed to create marketplace partner record:', marketplaceError);
        } else {
          console.log('Marketplace partner record created for partner:', partner.id);
        }
      }

      // 3. Create partner specializations
      if (request.intervention_types && request.intervention_types.length > 0) {
        const specializations = request.intervention_types.map((typeId: string) => ({
          partner_id: partner.id,
          intervention_type_id: typeId,
        }));
        
        const { error: specError } = await supabaseAdmin
          .from('partner_specializations')
          .insert(specializations);

        if (specError) {
          console.log('Warning: Failed to create specializations:', specError);
        }
      }
    }

    // Update request status
    const { error: updateError } = await supabaseAdmin
      .from('partner_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.log('Error updating request:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update request status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Partner request processed successfully:', { requestId, action });
    return new Response(JSON.stringify({ success: true, action }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in approve-partner function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
