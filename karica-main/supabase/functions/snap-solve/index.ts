import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  type: 'heating_system' | 'external';
  analysisId: string;
}

// Validation keywords for each type
const HEATING_KEYWORDS = ['caldaia', 'boiler', 'condizionatore', 'climatizzatore', 'pompa', 'termostato', 'radiatore', 'vaillant', 'baxi', 'ariston', 'daikin', 'beretta', 'ferroli', 'immergas', 'junkers', 'riello', 'riscaldamento', 'heater', 'hvac'];
const EXTERNAL_KEYWORDS = ['edificio', 'building', 'facciata', 'facade', 'finestra', 'window', 'tetto', 'roof', 'balcone', 'balcony', 'appartamento', 'casa', 'villa', 'condominio', 'muro', 'wall', 'intonaco', 'cappotto', 'esterno'];
const PERSON_KEYWORDS = ['persona', 'person', 'volto', 'face', 'uomo', 'man', 'donna', 'woman', 'selfie', 'portrait', 'ritratto', 'capelli', 'hair', 'occhi', 'eyes', 'barba', 'beard'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const analysisType = formData.get('type') as 'heating_system' | 'external';
    const analysisId = formData.get('analysisId') as string;
    
    if (!file || !analysisType || !analysisId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, type, analysisId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${analysisType} analysis:`, file.name, file.type, file.size);

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let base64 = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      base64 += String.fromCharCode.apply(null, Array.from(chunk));
    }
    base64 = btoa(base64);
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Build validation + extraction prompt based on analysis type
    let systemPrompt = '';
    let userPrompt = '';
    const expectedType = analysisType === 'heating_system' ? 'impianto termico' : 'esterno edificio';
    const validKeywords = analysisType === 'heating_system' ? HEATING_KEYWORDS : EXTERNAL_KEYWORDS;

    if (analysisType === 'heating_system') {
      systemPrompt = `Sei un esperto tecnico di impianti di riscaldamento e climatizzazione.

PRIMA DI TUTTO: Verifica che l'immagine mostri effettivamente un impianto di riscaldamento/climatizzazione (caldaia, condizionatore, pompa di calore, scaldabagno, termostato, ecc.).

Se l'immagine NON mostra un impianto termico (ad esempio mostra una persona, un selfie, un documento, o altro):
Rispondi con: {"is_valid": false, "rejection_reason": "descrizione di cosa mostra l'immagine", "expected": "caldaia, condizionatore o altro impianto termico"}

Se l'immagine MOSTRA un impianto termico, analizzalo ed estrai:
1. brand: Marca del produttore (Vaillant, Baxi, Daikin, Ariston, Beretta, Ferroli, Immergas, ecc.)
2. model: Modello specifico se visibile
3. estimated_year: Anno stimato di produzione
4. fuel_type: Tipo combustibile (gas, gpl, gasolio, elettrico, pompa_calore)
5. device_type: Tipo apparecchio (caldaia_tradizionale, caldaia_condensazione, condizionatore_split, pompa_calore, scaldabagno)
6. energy_class: Classe energetica stimata (A+++, A++, A+, A, B, C, D, E, F, G)
7. estimated_efficiency: Efficienza stimata (60-105%)
8. issues_detected: Problemi visibili []

Rispondi SOLO in JSON:
{
  "is_valid": true,
  "brand": "marca o null",
  "model": "modello o null",
  "estimated_year": numero o null,
  "fuel_type": "tipo o null",
  "device_type": "tipo o null",
  "energy_class": "classe o null",
  "estimated_efficiency": numero o null,
  "issues_detected": [],
  "confidence": 0.0-1.0
}`;
      userPrompt = "Verifica che questa immagine mostri un impianto di riscaldamento/climatizzazione. Se sì, identifica marca, modello, anno ed efficienza. Se no, rifiuta con spiegazione.";

    } else if (analysisType === 'external') {
      systemPrompt = `Sei un esperto certificatore energetico italiano.

PRIMA DI TUTTO: Verifica che l'immagine mostri effettivamente l'esterno di un edificio/abitazione (facciata, finestre, tetto, balconi, ecc.).

Se l'immagine NON mostra un edificio (ad esempio mostra una persona, un selfie, un interno, o altro):
Rispondi con: {"is_valid": false, "rejection_reason": "descrizione di cosa mostra l'immagine", "expected": "foto esterna di un edificio o abitazione"}

Se l'immagine MOSTRA un edificio, analizzalo ed estrai:
1. window_type: Tipo di infissi (vetro_singolo, vetro_doppio, triplo_vetro)
2. window_frame_material: Materiale infissi (legno_vecchio, legno_nuovo, alluminio, pvc)
3. facade_condition: Stato facciata (ottimo, buono, discreto, cattivo, pessimo)
4. insulation_visible: Isolamento visibile (cappotto_termico, nessuno_evidente, intonaco_nuovo)
5. building_age_estimate: Età stimata (pre_1970, 1970_1990, 1990_2005, 2005_2015, post_2015)
6. building_type: Tipo (appartamento, villetta, bifamiliare, condominio, rustico)
7. roof_condition: Stato tetto (buono, discreto, cattivo, non_visibile)
8. estimated_class: Classe energetica stimata (A4, A3, A2, A1, B, C, D, E, F, G)

Rispondi SOLO in JSON:
{
  "is_valid": true,
  "window_type": "tipo o null",
  "window_frame_material": "materiale o null",
  "facade_condition": "stato o null",
  "insulation_visible": "tipo o null",
  "building_age_estimate": "periodo o null",
  "building_type": "tipo o null",
  "roof_condition": "stato o null",
  "estimated_class": "classe o null",
  "confidence": 0.0-1.0
}`;
      userPrompt = "Verifica che questa immagine mostri l'esterno di un edificio. Se sì, stima la classe energetica basandoti su infissi, facciata e stato generale. Se no, rifiuta con spiegazione.";
    }

    // Call AI Vision API
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Troppi tentativi. Riprova tra qualche minuto.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crediti AI esauriti. Contatta il supporto.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${aiResponse.status} ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    let extractedData;
    try {
      const content = aiData.choices[0].message.content;
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        // No JSON found - likely a text rejection
        console.log('No JSON in response, treating as rejection:', content);
        
        // Check if the response mentions a person/selfie
        const lowerContent = content.toLowerCase();
        const isPerson = PERSON_KEYWORDS.some(kw => lowerContent.includes(kw));
        
        extractedData = { 
          is_valid: false, 
          rejection_reason: isPerson 
            ? 'L\'immagine mostra una persona, non un ' + expectedType
            : 'L\'immagine non mostra un ' + expectedType,
          expected: expectedType
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      
      // Check raw content for person keywords
      const content = aiData.choices[0]?.message?.content || '';
      const lowerContent = content.toLowerCase();
      const isPerson = PERSON_KEYWORDS.some(kw => lowerContent.includes(kw));
      
      if (isPerson) {
        extractedData = { 
          is_valid: false, 
          rejection_reason: 'L\'immagine mostra una persona, non un ' + expectedType,
          expected: expectedType
        };
      } else {
        extractedData = { 
          is_valid: false,
          rejection_reason: 'Impossibile analizzare l\'immagine. Assicurati che mostri un ' + expectedType,
          expected: expectedType
        };
      }
    }

    // Check if image was rejected
    if (extractedData.is_valid === false) {
      console.log('Image rejected:', extractedData.rejection_reason);
      
      const friendlyExpected = analysisType === 'heating_system' 
        ? 'la caldaia, il condizionatore o l\'impianto termico'
        : 'l\'esterno della casa (facciata, finestre, tetto)';
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'invalid_image',
          message: `Questa foto non sembra mostrare ${friendlyExpected}. Per favore, scatta una nuova foto.`,
          details: extractedData.rejection_reason,
          expected: friendlyExpected
        }),
        {
          status: 422, // Unprocessable Entity
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Remove validation fields before storing
    delete extractedData.is_valid;

    // Update home_analysis record with results
    const updateField = analysisType === 'heating_system' ? 'heating_analysis' : 'external_analysis';
    
    const { error: updateError } = await supabase
      .from('home_analysis')
      .update({ 
        [updateField]: extractedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', analysisId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update analysis: ${updateError.message}`);
    }

    console.log(`${analysisType} analysis completed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        type: analysisType,
        data: extractedData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in snap-solve function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
