
-- Privacy Notices table
CREATE TABLE public.privacy_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Retired')),
  effective_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  modified_by UUID REFERENCES auth.users(id),
  fiduciary_name TEXT,
  fiduciary_contact TEXT,
  data_categories JSONB DEFAULT '[]'::jsonb,
  purposes JSONB DEFAULT '[]'::jsonb,
  retention_periods JSONB DEFAULT '[]'::jsonb,
  third_parties JSONB DEFAULT '[]'::jsonb,
  cross_border_transfers TEXT,
  grievance_officer_name TEXT,
  grievance_officer_email TEXT,
  grievance_officer_designation TEXT,
  grievance_response_timeline TEXT DEFAULT '30 days',
  dpb_complaint_route TEXT,
  rights_description TEXT,
  withdraw_consent_link TEXT DEFAULT '/privacy-preferences',
  material_change BOOLEAN DEFAULT false
);

ALTER TABLE public.privacy_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage privacy_notices" ON public.privacy_notices FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view active notices" ON public.privacy_notices FOR SELECT TO authenticated USING (status = 'Active');
CREATE POLICY "Anon can view active notices" ON public.privacy_notices FOR SELECT TO anon USING (status = 'Active');

-- Notice Translations
CREATE TABLE public.notice_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES public.privacy_notices(id) ON DELETE CASCADE NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  content TEXT NOT NULL DEFAULT '',
  translation_status TEXT NOT NULL DEFAULT 'Pending' CHECK (translation_status IN ('Pending', 'Under Review', 'Approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(notice_id, language)
);

ALTER TABLE public.notice_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage notice_translations" ON public.notice_translations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view approved translations" ON public.notice_translations FOR SELECT TO anon USING (translation_status = 'Approved');
CREATE POLICY "Auth can view translations" ON public.notice_translations FOR SELECT TO authenticated USING (true);

-- Consent Receipts
CREATE TABLE public.consent_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  notice_version_id UUID REFERENCES public.privacy_notices(id),
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  categories_accepted TEXT[] DEFAULT '{}',
  categories_rejected TEXT[] DEFAULT '{}',
  action_type TEXT NOT NULL DEFAULT 'accept_all' CHECK (action_type IN ('accept_all', 'reject_all', 'custom', 'updated', 'withdrawn')),
  ip_address TEXT,
  user_agent TEXT,
  banner_language TEXT DEFAULT 'en',
  withdrawal_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consent_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage consent_receipts" ON public.consent_receipts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own consent" ON public.consent_receipts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own consent" ON public.consent_receipts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anon can insert consent" ON public.consent_receipts FOR INSERT TO anon WITH CHECK (user_id IS NULL);

-- Rights Requests
CREATE TABLE public.rights_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  request_type TEXT NOT NULL,
  description TEXT,
  supporting_doc_path TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Pending Info', 'In Progress', 'Completed', 'Rejected')),
  assigned_to UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  resolution_summary TEXT,
  internal_notes TEXT,
  communication_log JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sla_deadline TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.rights_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage rights_requests" ON public.rights_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own requests" ON public.rights_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own requests" ON public.rights_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Grievances
CREATE TABLE public.grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  nature TEXT NOT NULL,
  description TEXT,
  evidence_path TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Acknowledged', 'Under Investigation', 'Resolved', 'Escalated to DPB')),
  assigned_to UUID REFERENCES auth.users(id),
  resolution_summary TEXT,
  internal_notes TEXT,
  communication_log JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  sla_deadline_ack TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '48 hours'),
  sla_deadline_resolution TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage grievances" ON public.grievances FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own grievances" ON public.grievances FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own grievances" ON public.grievances FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Consent Audit Log (append-only)
CREATE TABLE public.consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id UUID,
  actor_type TEXT NOT NULL DEFAULT 'system' CHECK (actor_type IN ('user', 'admin', 'system')),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('Consent', 'Notice', 'Rights Request', 'Grievance', 'Export', 'Auth')),
  entity_id UUID,
  previous_state TEXT,
  new_state TEXT,
  ip_address TEXT,
  notes TEXT
);

ALTER TABLE public.consent_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view consent_audit_log" ON public.consent_audit_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert audit_log" ON public.consent_audit_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anon can insert audit_log" ON public.consent_audit_log FOR INSERT TO anon WITH CHECK (true);
