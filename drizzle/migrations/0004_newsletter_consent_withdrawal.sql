ALTER TABLE public.marketing_leads
  ADD COLUMN IF NOT EXISTS consent_version text,
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_token text UNIQUE;
ALTER TABLE public.marketing_leads DROP CONSTRAINT IF EXISTS marketing_leads_status_check;
ALTER TABLE public.marketing_leads ADD CONSTRAINT marketing_leads_status_check CHECK (status IN ('new','contacted','qualified','closed','subscribed','withdrawn'));