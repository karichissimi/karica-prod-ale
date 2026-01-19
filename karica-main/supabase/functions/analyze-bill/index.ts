import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Profilo ARERA standard per clienti domestici residenti (3 kW)
// Distribuzione percentuale mensile del consumo annuo
const ARERA_PROFILE: Record<number, number> = {
  1: 0.092,  // Gennaio 9.2%
  2: 0.085,  // Febbraio 8.5%
  3: 0.080,  // Marzo 8.0%
  4: 0.072,  // Aprile 7.2%
  5: 0.070,  // Maggio 7.0%
  6: 0.083,  // Giugno 8.3%
  7: 0.095,  // Luglio 9.5%
  8: 0.088,  // Agosto 8.8%
  9: 0.078,  // Settembre 7.8%
  10: 0.075, // Ottobre 7.5%
  11: 0.082, // Novembre 8.2%
  12: 0.100  // Dicembre 10.0%
};

// Determina i mesi coperti da un intervallo di date
function getMonthsCovered(periodStart: string, periodEnd: string): number[] {
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  
  const monthsCovered: number[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const month = currentDate.getMonth() + 1; // 1-12
    if (!monthsCovered.includes(month)) {
      monthsCovered.push(month);
    }
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  // Se abbiamo un solo mese parziale
  if (monthsCovered.length === 0) {
    const month = startDate.getMonth() + 1;
    monthsCovered.push(month);
  }
  
  return monthsCovered;
}

// Calcola il peso ARERA totale per un set di mesi
function getAreraWeight(months: number[]): number {
  return months.reduce((sum, m) => sum + (ARERA_PROFILE[m] || 0), 0);
}

// Determina i mesi mancanti dato un range di date
function getMissingMonths(periodStart: string, periodEnd: string): number[] {
  const coveredMonths = getMonthsCovered(periodStart, periodEnd);
  const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return allMonths.filter(m => !coveredMonths.includes(m));
}

// Tipo di metodo di proiezione
type ProjectionMethod = 'historical_complete' | 'historical_partial' | 'arera_projection' | 'direct';

// Interfaccia per il risultato del calcolo
interface AnnualCalculationResult {
  annualProjection: number;
  method: ProjectionMethod;
  monthsCovered: number[];
  monthsProjected: number[];
  totalWeight: number;
  confidence: 'alta' | 'media' | 'bassa';
  details: {
    historical_consumption?: number;
    projected_addition?: number;
    arera_profile: Record<number, number>;
  };
}

// Calcola la proiezione annuale con logica a 3 livelli
function calculateAnnualConsumption(
  periodConsumption: number | null,
  periodStart: string | null,
  periodEnd: string | null,
  annualConsumptionReported: number | null,
  annualPeriodStart: string | null,
  annualPeriodEnd: string | null
): AnnualCalculationResult | null {
  
  console.log('=== ANNUAL CALCULATION INPUT ===');
  console.log('Period consumption:', periodConsumption);
  console.log('Period:', periodStart, '-', periodEnd);
  console.log('Annual reported:', annualConsumptionReported);
  console.log('Annual period:', annualPeriodStart, '-', annualPeriodEnd);
  
  // CASO 1: Consumo annuo storico completo (12 mesi)
  if (annualConsumptionReported && annualPeriodStart && annualPeriodEnd) {
    const coveredMonths = getMonthsCovered(annualPeriodStart, annualPeriodEnd);
    
    if (coveredMonths.length >= 12) {
      console.log('=== CASE 1: HISTORICAL COMPLETE ===');
      console.log('Using reported annual consumption directly:', annualConsumptionReported);
      
      return {
        annualProjection: Math.round(annualConsumptionReported),
        method: 'historical_complete',
        monthsCovered: coveredMonths,
        monthsProjected: [],
        totalWeight: 1.0,
        confidence: 'alta',
        details: {
          historical_consumption: annualConsumptionReported,
          arera_profile: ARERA_PROFILE
        }
      };
    }
    
    // CASO 2: Consumo annuo storico parziale (6-11 mesi)
    if (coveredMonths.length >= 6) {
      console.log('=== CASE 2: HISTORICAL PARTIAL ===');
      console.log('Covered months:', coveredMonths.length);
      
      const missingMonths = getMissingMonths(annualPeriodStart, annualPeriodEnd);
      const coveredWeight = getAreraWeight(coveredMonths);
      
      // Media mensile ponderata dal consumo noto
      const avgMonthlyConsumption = annualConsumptionReported / coveredMonths.length;
      
      // Proiezione per i mesi mancanti usando ARERA
      let projectedAddition = 0;
      missingMonths.forEach(month => {
        const avgCoveredWeight = coveredWeight / coveredMonths.length;
        const monthEstimate = avgMonthlyConsumption * (ARERA_PROFILE[month] / avgCoveredWeight);
        projectedAddition += monthEstimate;
      });
      
      const annualProjection = Math.round(annualConsumptionReported + projectedAddition);
      
      console.log('Missing months:', missingMonths);
      console.log('Projected addition:', projectedAddition);
      console.log('Final annual projection:', annualProjection);
      
      return {
        annualProjection,
        method: 'historical_partial',
        monthsCovered: coveredMonths,
        monthsProjected: missingMonths,
        totalWeight: coveredWeight,
        confidence: 'media',
        details: {
          historical_consumption: annualConsumptionReported,
          projected_addition: Math.round(projectedAddition),
          arera_profile: ARERA_PROFILE
        }
      };
    }
  }
  
  // CASO 3: Solo consumo di periodo → proiezione ARERA completa
  if (periodConsumption && periodStart && periodEnd) {
    console.log('=== CASE 3: ARERA PROJECTION ===');
    
    const monthsCovered = getMonthsCovered(periodStart, periodEnd);
    const totalWeight = getAreraWeight(monthsCovered);
    
    const annualProjection = Math.round(periodConsumption / totalWeight);
    const missingMonths = getMissingMonths(periodStart, periodEnd);
    
    console.log('Months covered:', monthsCovered);
    console.log('Total ARERA weight:', (totalWeight * 100).toFixed(1) + '%');
    console.log('Annual projection:', annualProjection, 'kWh/year');
    
    return {
      annualProjection,
      method: 'arera_projection',
      monthsCovered,
      monthsProjected: missingMonths,
      totalWeight,
      confidence: monthsCovered.length >= 3 ? 'media' : 'bassa',
      details: {
        arera_profile: ARERA_PROFILE
      }
    };
  }
  
  // CASO 4: Fallback - solo consumo senza date
  if (periodConsumption) {
    console.log('=== CASE 4: DIRECT FALLBACK ===');
    return {
      annualProjection: Math.round(periodConsumption * 12),
      method: 'direct',
      monthsCovered: [],
      monthsProjected: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      totalWeight: 1/12,
      confidence: 'bassa',
      details: {
        arera_profile: ARERA_PROFILE
      }
    };
  }
  
  return null;
}

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

    let fileName: string;
    let fileType: string;
    let base64: string;
    let arrayBuffer: ArrayBuffer;

    // Check content type to determine how to parse the request
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON payload (mobile-friendly approach)
      const jsonBody = await req.json();
      
      if (!jsonBody.fileData || !jsonBody.fileName || !jsonBody.fileType) {
        return new Response(
          JSON.stringify({ error: 'Missing file data in JSON payload' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      fileName = jsonBody.fileName;
      fileType = jsonBody.fileType;
      base64 = jsonBody.fileData;
      
      // Convert base64 back to ArrayBuffer for storage
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
      
      console.log('=== ANALYZE BILL START (JSON) ===');
      console.log('User ID:', user.id);
      console.log('File details:', { name: fileName, type: fileType, size: arrayBuffer.byteLength });
    } else {
      // Handle FormData (original approach for desktop)
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('=== ANALYZE BILL START (FormData) ===');
      console.log('User ID:', user.id);
      console.log('File details:', { name: file.name, type: file.type, size: file.size });

      fileName = file.name;
      fileType = file.type;
      arrayBuffer = await file.arrayBuffer();
      
      // Convert file to base64 for AI analysis - safely handle large files
      const bytes = new Uint8Array(arrayBuffer);
      
      // Convert to base64 in chunks to avoid stack overflow
      base64 = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        base64 += String.fromCharCode.apply(null, Array.from(chunk));
      }
      base64 = btoa(base64);
    }

    // Upload to storage first (for all file types)
    const storagePath = `${user.id}/${Date.now()}_${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('bills')
      .upload(storagePath, arrayBuffer, {
        contentType: fileType,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    console.log('File uploaded to storage:', storagePath);

    // Check if file is PDF or image
    const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
    
    console.log('File converted to base64, length:', base64.length);
    console.log('File type:', fileType, 'isPdf:', isPdf);
    
    // For PDFs, Gemini can analyze them directly via base64
    // For images, we use the image_url format
    const contentForAI = isPdf 
      ? {
          type: 'image_url',
          image_url: {
            url: `data:application/pdf;base64,${base64}`
          }
        }
      : {
          type: 'image_url',
          image_url: {
            url: `data:${fileType};base64,${base64}`
          }
        };

    // Enhanced AI prompt for Italian energy bills with period extraction AND annual data
    const systemPrompt = `Sei un assistente esperto nell'analisi di bollette energetiche italiane.
Il tuo compito è estrarre con precisione queste informazioni dalla bolletta:

1. **PERIODO DI FATTURAZIONE CORRENTE** (OBBLIGATORIO):
   - Data inizio periodo fatturato (format: YYYY-MM-DD)
   - Data fine periodo fatturato (format: YYYY-MM-DD)
   - Cerca "Periodo di riferimento", "Periodo fatturazione", "Dal... al...", "Periodo dal"

2. **CONSUMO DEL PERIODO FATTURATO** (OBBLIGATORIO):
   - Consumo in kWh relativo SOLO al periodo fatturato corrente
   - Cerca "Consumi fatturati", "kWh consumati", "Energia attiva", "Totale consumi periodo"

3. **CONSUMO ANNUO STORICO** (SE PRESENTE):
   - Molte bollette riportano il consumo degli ultimi 12 mesi
   - Cerca "Consumo annuo", "Consumi ultimi 12 mesi", "Consumo annuo stimato", "Totale annuo"
   - Estrai anche il periodo coperto (es. "dal 01/12/2024 al 30/11/2025")

4. **POD (Punto di Prelievo)**: 
   - Codice alfanumerico di 14-15 caratteri che inizia con "IT"
   - Formato tipico: IT001E12345678 o IT001E1234567X
   - Cerca vicino a "Punto di Prelievo", "POD", "Codice POD"

5. **Fornitore Energetico**:
   - Nome dell'azienda che emette la bolletta
   - Fornitori comuni italiani: Enel Energia, Eni Plenitude, A2A Energia, Edison, Sorgenia, Illumia, Axpo, Engie, Hera, Iren, E.ON, Wekiwi, Plenitude, Octopus Energy

6. **Tipo di Tariffa/Contratto**:
   - "monorario" = tariffa unica tutto il giorno
   - "biorario" = tariffa F1/F23 (fascia luce)
   - "triorario" = tariffa F1/F2/F3 (tre fasce)

7. **Potenza Impegnata (kW)**:
   - Valori tipici: 3, 3.3, 4.5, 6 kW per residenziale

8. **Codice Cliente**:
   - Codice numerico identificativo del cliente

9. **Prezzo kWh (€/kWh)**:
   - Prezzo unitario dell'energia

Rispondi ESCLUSIVAMENTE in formato JSON valido:
{
  "period_start": "YYYY-MM-DD o null",
  "period_end": "YYYY-MM-DD o null",
  "period_consumption": numero in kWh o null,
  "annual_consumption_reported": numero in kWh o null (consumo annuo storico se presente),
  "annual_period_start": "YYYY-MM-DD o null (inizio periodo consumo annuo)",
  "annual_period_end": "YYYY-MM-DD o null (fine periodo consumo annuo)",
  "pod": "codice POD o null",
  "supplier": "nome fornitore o null", 
  "tariff_type": "monorario" | "biorario" | "triorario" | null,
  "power_kw": numero decimale o null,
  "customer_code": "codice cliente o null",
  "price_kwh": numero decimale o null
}

REGOLE CRITICHE:
- period_consumption è il consumo DEL PERIODO fatturato corrente, NON il consumo annuo
- annual_consumption_reported è il consumo annuo storico SE PRESENTE in bolletta (ultimi 12 mesi)
- Cerca attentamente le date del periodo di riferimento
- Per le date usa formato ISO YYYY-MM-DD
- Per i numeri, restituisci solo valori numerici senza unità (es. 1987.63 non "1987,63 kWh")
- Non aggiungere commenti, spiegazioni o markdown`;

    // For both PDF and images, we send the file directly to Gemini which can process both
    const userMessage = [
      {
        type: 'text',
        text: 'Analizza questa bolletta energetica italiana. IMPORTANTE: Estrai il CONSUMO DEL PERIODO fatturato (non annuo) e le DATE ESATTE del periodo di riferimento. Cerca attentamente "Periodo di riferimento", "Dal... al...", "Consumi fatturati".'
      },
      contentForAI
    ];

    console.log('Sending request to AI...');
    console.log('Model: google/gemini-2.5-flash');

    // Analyze with AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 600,
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
    console.log('=== AI RAW RESPONSE ===');
    console.log(JSON.stringify(aiData, null, 2));

    interface ExtractedBillData {
      period_start: string | null;
      period_end: string | null;
      period_consumption: number | null;
      // NEW: Annual consumption data from bill
      annual_consumption_reported: number | null;
      annual_period_start: string | null;
      annual_period_end: string | null;
      // Calculated projection
      annual_consumption_projected: number | null;
      projection_method: ProjectionMethod | null;
      projection_details: {
        months_covered: number[];
        months_projected: number[];
        total_weight: number;
        confidence: 'alta' | 'media' | 'bassa';
        historical_consumption?: number;
        projected_addition?: number;
        arera_profile: Record<number, number>;
      } | null;
      pod: string | null;
      supplier: string | null;
      tariff_type: 'monorario' | 'biorario' | 'triorario' | null;
      power_kw: number | null;
      customer_code: string | null;
      price_kwh: number | null;
    }
    
    let extractedData: ExtractedBillData = { 
      period_start: null,
      period_end: null,
      period_consumption: null,
      annual_consumption_reported: null,
      annual_period_start: null,
      annual_period_end: null,
      annual_consumption_projected: null,
      projection_method: null,
      projection_details: null,
      pod: null, 
      supplier: null,
      tariff_type: null,
      power_kw: null,
      customer_code: null,
      price_kwh: null
    };
    
    try {
      const content = aiData.choices[0].message.content;
      console.log('=== AI CONTENT ===');
      console.log(content);
      
      // Remove markdown code blocks if present
      let jsonContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log('=== CLEANED JSON ===');
      console.log(jsonContent);
      
      const parsed = JSON.parse(jsonContent);
      
      // Validate period dates
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (parsed.period_start && dateRegex.test(parsed.period_start)) {
        extractedData.period_start = parsed.period_start;
      }
      if (parsed.period_end && dateRegex.test(parsed.period_end)) {
        extractedData.period_end = parsed.period_end;
      }
      
      // Validate period consumption
      if (parsed.period_consumption !== null && parsed.period_consumption !== undefined) {
        let consumption = parsed.period_consumption;
        if (typeof consumption === 'string') {
          consumption = consumption.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
          consumption = parseFloat(consumption);
        }
        if (!isNaN(consumption) && consumption > 0 && consumption < 50000) {
          extractedData.period_consumption = Math.round(consumption);
        }
      }
      
      // NEW: Validate annual consumption reported from bill
      if (parsed.annual_consumption_reported !== null && parsed.annual_consumption_reported !== undefined) {
        let annualConsumption = parsed.annual_consumption_reported;
        if (typeof annualConsumption === 'string') {
          annualConsumption = annualConsumption.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
          annualConsumption = parseFloat(annualConsumption);
        }
        if (!isNaN(annualConsumption) && annualConsumption > 0 && annualConsumption < 100000) {
          extractedData.annual_consumption_reported = Math.round(annualConsumption * 100) / 100;
        }
      }
      
      // NEW: Validate annual period dates
      if (parsed.annual_period_start && dateRegex.test(parsed.annual_period_start)) {
        extractedData.annual_period_start = parsed.annual_period_start;
      }
      if (parsed.annual_period_end && dateRegex.test(parsed.annual_period_end)) {
        extractedData.annual_period_end = parsed.annual_period_end;
      }
      
      // Calculate annual projection using 3-level logic
      const calculationResult = calculateAnnualConsumption(
        extractedData.period_consumption,
        extractedData.period_start,
        extractedData.period_end,
        extractedData.annual_consumption_reported,
        extractedData.annual_period_start,
        extractedData.annual_period_end
      );
      
      if (calculationResult) {
        extractedData.annual_consumption_projected = calculationResult.annualProjection;
        extractedData.projection_method = calculationResult.method;
        extractedData.projection_details = {
          months_covered: calculationResult.monthsCovered,
          months_projected: calculationResult.monthsProjected,
          total_weight: calculationResult.totalWeight,
          confidence: calculationResult.confidence,
          historical_consumption: calculationResult.details.historical_consumption,
          projected_addition: calculationResult.details.projected_addition,
          arera_profile: calculationResult.details.arera_profile
        };
      }
      
      // Validate and normalize POD
      if (parsed.pod) {
        const podClean = parsed.pod.toString().replace(/\s/g, '').toUpperCase();
        // POD italiano deve iniziare con IT e avere 14-15 caratteri
        if (podClean.startsWith('IT') && podClean.length >= 14 && podClean.length <= 15) {
          extractedData.pod = podClean;
        } else {
          console.log('Invalid POD format, discarding:', podClean);
        }
      }
      
      // Validate supplier
      if (parsed.supplier && typeof parsed.supplier === 'string' && parsed.supplier.length > 1) {
        extractedData.supplier = parsed.supplier.trim();
      }
      
      // Validate tariff type
      const validTariffs = ['monorario', 'biorario', 'triorario'];
      if (parsed.tariff_type && validTariffs.includes(parsed.tariff_type.toLowerCase())) {
        extractedData.tariff_type = parsed.tariff_type.toLowerCase() as 'monorario' | 'biorario' | 'triorario';
      }
      
      // Validate power
      if (parsed.power_kw !== null && parsed.power_kw !== undefined) {
        let power = parsed.power_kw;
        if (typeof power === 'string') {
          power = power.replace(/,/g, '.').replace(/[^\d.]/g, '');
          power = parseFloat(power);
        }
        if (!isNaN(power) && power > 0 && power < 100) {
          extractedData.power_kw = Math.round(power * 10) / 10; // Round to 1 decimal
        }
      }
      
      // Validate customer code
      if (parsed.customer_code && typeof parsed.customer_code === 'string' && parsed.customer_code.length >= 3) {
        extractedData.customer_code = parsed.customer_code.trim();
      }
      
      // Validate price per kWh
      if (parsed.price_kwh !== null && parsed.price_kwh !== undefined) {
        let price = parsed.price_kwh;
        if (typeof price === 'string') {
          price = price.replace(/,/g, '.').replace(/[^\d.]/g, '');
          price = parseFloat(price);
        }
        if (!isNaN(price) && price > 0 && price < 1) {
          extractedData.price_kwh = Math.round(price * 1000) / 1000; // Round to 3 decimals
        }
      }
      
      console.log('=== EXTRACTED DATA ===');
      console.log(JSON.stringify(extractedData, null, 2));
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw content that failed to parse:', aiData.choices?.[0]?.message?.content);
    }

    // Save to bill_uploads
    const { error: dbError } = await supabase
      .from('bill_uploads')
      .insert({
        user_id: user.id,
        file_path: fileName,
        ocr_data: extractedData
      });

    if (dbError) {
      console.error('Database error (bill_uploads):', dbError);
      throw new Error(`Failed to save bill data: ${dbError.message}`);
    }

    // Also update profiles table with the projected annual consumption
    const profileUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };
    
    if (extractedData.pod) {
      profileUpdate.pod = extractedData.pod;
    }
    if (extractedData.supplier) {
      profileUpdate.energy_supplier = extractedData.supplier;
    }
    if (extractedData.annual_consumption_projected) {
      profileUpdate.annual_consumption_kwh = extractedData.annual_consumption_projected;
    }

    if (Object.keys(profileUpdate).length > 1) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Non-fatal, continue
      } else {
        console.log('Profile updated with bill data');
      }
    }

    console.log('=== ANALYZE BILL COMPLETE ===');

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData,
        file_path: fileName,
        isPdf
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in analyze-bill function:', error);
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
