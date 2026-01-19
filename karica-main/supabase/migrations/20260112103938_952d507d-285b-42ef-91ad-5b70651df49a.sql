-- =============================================
-- FASE 1: COMMISSIONI (Pilastro fondamentale)
-- =============================================

-- Registro commissioni (tutte le fee Karica)
CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('order', 'loan', 'lead', 'intervention')),
  source_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid')),
  partner_id uuid REFERENCES public.partners(id),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  invoiced_at timestamptz,
  paid_at timestamptz
);

-- Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- RLS: Admin può vedere tutto
CREATE POLICY "Admins can manage all commissions"
ON public.commissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Partner può vedere solo le proprie commissioni
CREATE POLICY "Partners can view their own commissions"
ON public.commissions
FOR SELECT
TO authenticated
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- =============================================
-- FASE 2: VERBALE FINE LAVORI (Completamento Pilastro 2)
-- =============================================

-- Aggiungere colonne a leads per completamento lavori
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS completion_document_url text,
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS invoice_status text DEFAULT 'none' CHECK (invoice_status IN ('none', 'pending', 'sent', 'paid'));

-- =============================================
-- FASE 3: FINANZA (Pilastro 3)
-- =============================================

-- Partner finanziari (banche, finanziarie)
CREATE TABLE public.loan_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  description text,
  interest_rate_min numeric,
  interest_rate_max numeric,
  max_duration_months integer DEFAULT 120,
  min_amount numeric DEFAULT 1000,
  max_amount numeric DEFAULT 100000,
  commission_rate numeric DEFAULT 0.02, -- 2% fee Karica
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Richieste prestito
CREATE TABLE public.loan_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  intervention_id uuid REFERENCES public.interventions(id),
  loan_partner_id uuid REFERENCES public.loan_partners(id),
  amount_requested numeric NOT NULL,
  duration_months integer NOT NULL,
  purpose text, -- 'energy_efficiency', 'renovation', 'solar', etc.
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'disbursed', 'cancelled')),
  interest_rate numeric,
  monthly_payment numeric,
  commission_amount numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

-- Enable RLS
ALTER TABLE public.loan_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_requests ENABLE ROW LEVEL SECURITY;

-- RLS loan_partners: tutti possono vedere partner attivi
CREATE POLICY "Anyone can view active loan partners"
ON public.loan_partners
FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS loan_partners: solo admin può gestire
CREATE POLICY "Admins can manage loan partners"
ON public.loan_partners
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS loan_requests: utente vede solo le proprie
CREATE POLICY "Users can view their own loan requests"
ON public.loan_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS loan_requests: utente può creare le proprie
CREATE POLICY "Users can create their own loan requests"
ON public.loan_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS loan_requests: admin può gestire tutto
CREATE POLICY "Admins can manage all loan requests"
ON public.loan_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- FASE 4: MARKETPLACE (Pilastro 4)
-- =============================================

-- Categorie prodotti
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prodotti/Servizi
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.product_categories(id),
  partner_id uuid REFERENCES public.partners(id),
  name text NOT NULL,
  description text,
  price_eur numeric NOT NULL,
  original_price_eur numeric, -- per sconti
  commission_rate numeric DEFAULT 0.10, -- 10% fee Karica
  image_url text,
  features jsonb, -- lista caratteristiche
  specifications jsonb, -- specifiche tecniche
  stock_quantity integer,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ordini
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal_amount numeric NOT NULL DEFAULT 0,
  shipping_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  shipping_address jsonb,
  billing_address jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz
);

-- Dettaglio ordini
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  product_name text NOT NULL, -- snapshot del nome
  product_price numeric NOT NULL, -- snapshot del prezzo
  quantity integer NOT NULL DEFAULT 1,
  subtotal numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS product_categories: tutti possono vedere categorie attive
CREATE POLICY "Anyone can view active categories"
ON public.product_categories
FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS product_categories: admin può gestire
CREATE POLICY "Admins can manage categories"
ON public.product_categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS products: tutti possono vedere prodotti attivi
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS products: partner può gestire i propri
CREATE POLICY "Partners can manage their own products"
ON public.products
FOR ALL
TO authenticated
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- RLS products: admin può gestire tutto
CREATE POLICY "Admins can manage all products"
ON public.products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS orders: utente vede solo i propri
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS orders: utente può creare i propri
CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS orders: admin può gestire tutto
CREATE POLICY "Admins can manage all orders"
ON public.orders
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS order_items: utente vede solo i propri (tramite order)
CREATE POLICY "Users can view their own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  order_id IN (
    SELECT id FROM public.orders WHERE user_id = auth.uid()
  )
);

-- RLS order_items: utente può creare per propri ordini
CREATE POLICY "Users can create their own order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  order_id IN (
    SELECT id FROM public.orders WHERE user_id = auth.uid()
  )
);

-- RLS order_items: admin può gestire tutto
CREATE POLICY "Admins can manage all order items"
ON public.order_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGERS per updated_at
-- =============================================

CREATE TRIGGER update_loan_partners_updated_at
BEFORE UPDATE ON public.loan_partners
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_loan_requests_updated_at
BEFORE UPDATE ON public.loan_requests
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_updated_at();

-- =============================================
-- STORAGE BUCKET per documenti lavori
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('work-documents', 'work-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Partner può caricare documenti
CREATE POLICY "Partners can upload work documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-documents' AND
  public.has_role(auth.uid(), 'partner')
);

-- Policy: Partner e Admin possono vedere documenti
CREATE POLICY "Partners and admins can view work documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'work-documents' AND
  (public.has_role(auth.uid(), 'partner') OR public.has_role(auth.uid(), 'admin'))
);

-- =============================================
-- DATI INIZIALI
-- =============================================

-- Categorie prodotti iniziali
INSERT INTO public.product_categories (name, slug, description, icon, sort_order) VALUES
('Climatizzazione', 'climatizzazione', 'Pompe di calore, condizionatori, caldaie', 'Thermometer', 1),
('Fotovoltaico', 'fotovoltaico', 'Pannelli solari, inverter, batterie', 'Sun', 2),
('Isolamento', 'isolamento', 'Cappotto termico, infissi, coibentazione', 'Home', 3),
('Smart Home', 'smart-home', 'Termostati intelligenti, domotica', 'Wifi', 4),
('Mobilità', 'mobilita', 'Colonnine ricarica, e-bike', 'Car', 5)
ON CONFLICT (slug) DO NOTHING;

-- Partner finanziario demo
INSERT INTO public.loan_partners (name, description, interest_rate_min, interest_rate_max, max_duration_months, min_amount, max_amount, commission_rate) VALUES
('Banca Verde', 'Finanziamenti dedicati all''efficienza energetica', 3.5, 6.5, 120, 5000, 75000, 0.02),
('EcoCredito', 'Prestiti green a tasso agevolato', 4.0, 7.0, 84, 2000, 50000, 0.025),
('Finanziaria Sostenibile', 'Soluzioni flessibili per la casa', 4.5, 8.0, 60, 1000, 30000, 0.03)
ON CONFLICT DO NOTHING;