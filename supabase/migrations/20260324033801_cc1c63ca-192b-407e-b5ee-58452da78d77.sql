-- ============================================================
-- Multi-Framework Assessment Engine (complete)
-- ============================================================

CREATE TABLE public.assessment_frameworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_code text NOT NULL UNIQUE,
  version text NOT NULL DEFAULT '1.0',
  description text,
  jurisdiction text NOT NULL DEFAULT 'India',
  regulatory_body text,
  effective_date date,
  icon_name text NOT NULL DEFAULT 'Shield',
  colour text NOT NULL DEFAULT '#3B82F6',
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.framework_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id uuid NOT NULL REFERENCES public.assessment_frameworks(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  section_ref text,
  penalty_ref text,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  conditional_flag text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (framework_id, code)
);

CREATE TABLE public.framework_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES public.framework_domains(id) ON DELETE CASCADE,
  item_code text NOT NULL,
  description text NOT NULL,
  guidance text,
  risk_level text NOT NULL DEFAULT 'standard',
  evidence_type text NOT NULL DEFAULT 'Document',
  sdf_only boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (domain_id, item_code)
);

CREATE TABLE public.assessment_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_type text NOT NULL DEFAULT 'single',
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assessment_template_frameworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
  framework_id uuid NOT NULL REFERENCES public.assessment_frameworks(id) ON DELETE CASCADE,
  UNIQUE (template_id, framework_id)
);

CREATE TABLE public.cross_framework_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_requirement_id uuid NOT NULL REFERENCES public.framework_requirements(id) ON DELETE CASCADE,
  target_requirement_id uuid NOT NULL REFERENCES public.framework_requirements(id) ON DELETE CASCADE,
  mapping_type text NOT NULL DEFAULT 'equivalent',
  mapping_notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_requirement_id, target_requirement_id)
);

ALTER TABLE public.assessments
  ADD COLUMN template_id uuid REFERENCES public.assessment_templates(id),
  ADD COLUMN framework_ids uuid[] DEFAULT '{}';

ALTER TABLE public.assessment_checks
  ADD COLUMN framework_id uuid REFERENCES public.assessment_frameworks(id),
  ADD COLUMN requirement_id uuid REFERENCES public.framework_requirements(id);

-- RLS
ALTER TABLE public.assessment_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.framework_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.framework_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_template_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_framework_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active frameworks" ON public.assessment_frameworks FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can insert frameworks" ON public.assessment_frameworks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update frameworks" ON public.assessment_frameworks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete frameworks" ON public.assessment_frameworks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active domains" ON public.framework_domains FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can insert domains" ON public.framework_domains FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update domains" ON public.framework_domains FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete domains" ON public.framework_domains FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active requirements" ON public.framework_requirements FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can insert requirements" ON public.framework_requirements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update requirements" ON public.framework_requirements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete requirements" ON public.framework_requirements FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active templates" ON public.assessment_templates FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can insert templates" ON public.assessment_templates FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update templates" ON public.assessment_templates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete templates" ON public.assessment_templates FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view template frameworks" ON public.assessment_template_frameworks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert template frameworks" ON public.assessment_template_frameworks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update template frameworks" ON public.assessment_template_frameworks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete template frameworks" ON public.assessment_template_frameworks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view mappings" ON public.cross_framework_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert mappings" ON public.cross_framework_mappings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update mappings" ON public.cross_framework_mappings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete mappings" ON public.cross_framework_mappings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Triggers
CREATE TRIGGER update_assessment_frameworks_updated_at
  BEFORE UPDATE ON public.assessment_frameworks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_templates_updated_at
  BEFORE UPDATE ON public.assessment_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed DPDP framework
INSERT INTO public.assessment_frameworks (id, name, short_code, version, description, jurisdiction, regulatory_body, effective_date, icon_name, colour, is_active, is_default)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Digital Personal Data Protection Act, 2023',
  'DPDP',
  '1.0',
  'India''s comprehensive data protection framework covering notice, consent, data principal rights, security safeguards, breach response, and governance obligations.',
  'India',
  'Data Protection Board of India',
  '2023-08-11',
  'Shield',
  '#10B981',
  true,
  true
);

INSERT INTO public.framework_domains (id, framework_id, code, name, section_ref, penalty_ref, display_order, conditional_flag) VALUES
('d0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000001', 'A', 'Notice & Transparency', 'Sec 5, Rule 3–4', '₹50 Cr', 0, NULL),
('d0000000-0000-0000-0000-00000000000b', 'a0000000-0000-0000-0000-000000000001', 'B', 'Consent Management', 'Sec 6, Rule 3–4', '₹50 Cr', 1, NULL),
('d0000000-0000-0000-0000-00000000000c', 'a0000000-0000-0000-0000-000000000001', 'C', 'Legitimate Use & Lawful Basis', 'Sec 4, 7', '₹50 Cr', 2, NULL),
('d0000000-0000-0000-0000-00000000000d', 'a0000000-0000-0000-0000-000000000001', 'D', 'Data Inventory & Quality', 'Sec 4, 8(1)–(3)', '₹50 Cr', 3, NULL),
('d0000000-0000-0000-0000-00000000000e', 'a0000000-0000-0000-0000-000000000001', 'E', 'Security Safeguards', 'Sec 8(5), Rule 6', '₹250 Cr', 4, NULL),
('d0000000-0000-0000-0000-00000000000f', 'a0000000-0000-0000-0000-000000000001', 'F', 'Breach Preparedness', 'Sec 8(6), Rule 7', '₹200 Cr', 5, NULL),
('d0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'G', 'Data Principal Rights', 'Sec 11–14, Rule 14', '₹50 Cr', 6, NULL),
('d0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'H', 'Retention & Erasure', 'Sec 8(7)–(8), Rule 8', '₹50 Cr', 7, NULL),
('d0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'I', 'Children''s Data', 'Sec 9, Rule 10', '₹200 Cr', 8, 'children'),
('d0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'J', 'Processor & Cross-Border', 'Sec 8(4–5), 16', '₹250 Cr', 9, NULL),
('d0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'K', 'Processor Obligations', 'Sec 8(4)', '₹250 Cr', 10, 'processor'),
('d0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'L', 'Governance & Accountability', 'Sec 8(9), 10, 26', '₹50 Cr', 11, NULL),
('d0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'M', 'Consent Manager', 'Sec 6(9), Rule 5', '₹50 Cr', 12, 'consentMgr'),
('d0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'N', 'Training & Awareness', 'N/A', '₹50 Cr', 13, NULL),
('d0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'O', 'Privacy by Design & Default', 'Sec 4(2), 8(1), Rule 6', '₹50 Cr', 14, NULL);

-- All 88 requirements
INSERT INTO public.framework_requirements (domain_id, item_code, description, risk_level, evidence_type, sdf_only, display_order) VALUES
('d0000000-0000-0000-0000-00000000000a', 'A.1', 'Published standalone privacy notice — data categories, purposes, rights, DPO contact, processor disclosures, cross-border', 'critical', 'Policy Document', false, 0),
('d0000000-0000-0000-0000-00000000000a', 'A.2', 'Notice in English + Eighth Schedule language, version control, change log', 'high', 'Policy Document', false, 1),
('d0000000-0000-0000-0000-00000000000a', 'A.3', 'Notice covers ALL processing streams — employee, vendor, CCTV, analytics', 'high', 'Policy Document', false, 2),
('d0000000-0000-0000-0000-00000000000a', 'A.4', 'Notice provided before/at time of data collection per stream (Sec 5(1))', 'high', 'SOP/Workflow', false, 3),
('d0000000-0000-0000-0000-00000000000b', 'B.1', 'Documented legal basis for EVERY processing stream', 'critical', 'Register', false, 0),
('d0000000-0000-0000-0000-00000000000b', 'B.2', 'Operational consent mechanism — granular, purpose-wise, affirmative, timestamped', 'critical', 'System/Platform', false, 1),
('d0000000-0000-0000-0000-00000000000b', 'B.3', 'Consent withdrawal with equal ease, triggering processing stop + processor notification', 'critical', 'System/Platform', false, 2),
('d0000000-0000-0000-0000-00000000000b', 'B.4', 'No dark patterns — no pre-ticked boxes, forced bundling (Sec 6(3))', 'high', 'UI/UX Review', false, 3),
('d0000000-0000-0000-0000-00000000000b', 'B.5', 'CM Board registration, token storage, log reconciliation, interoperability (Rule 5)', 'high', 'System Config', false, 4),
('d0000000-0000-0000-0000-00000000000b', 'B.6', 'Re-consent mechanism for purpose changes', 'high', 'SOP/Workflow', false, 5),
('d0000000-0000-0000-0000-00000000000c', 'C.1', 'Each Sec 7 stream: documented basis, statutory ground (7a–i), scope boundary', 'critical', 'Register', false, 0),
('d0000000-0000-0000-0000-00000000000c', 'C.2', 'Employment data (Sec 7(i)): documented purposes, biometric justification, proportionality', 'high', 'Assessment Record', false, 1),
('d0000000-0000-0000-0000-00000000000c', 'C.3', 'Govt/legal obligation (Sec 7(b–e)): specific statute/order/court per activity', 'high', 'Register', false, 2),
('d0000000-0000-0000-0000-00000000000c', 'C.4', 'Medical/epidemic/disaster (Sec 7(f–h)): minimisation, scope, termination triggers', 'standard', 'SOP', false, 3),
('d0000000-0000-0000-0000-00000000000c', 'C.5', 'Legacy data: fresh notice + consent re-obtained or legitimate use documented', 'high', 'Report', false, 4),
('d0000000-0000-0000-0000-00000000000d', 'D.1', 'Complete data inventory mapping ALL PD stores, flows, access, systems', 'critical', 'Register', false, 0),
('d0000000-0000-0000-0000-00000000000d', 'D.2', 'Data minimisation per processing stream', 'high', 'Assessment Record', false, 1),
('d0000000-0000-0000-0000-00000000000d', 'D.3', 'Purpose-to-processing mapping with mission-creep controls', 'high', 'Register', false, 2),
('d0000000-0000-0000-0000-00000000000d', 'D.4', 'Data accuracy: verification, correction workflows, quality checks (Sec 8(2)–(3))', 'standard', 'SOP', false, 3),
('d0000000-0000-0000-0000-00000000000e', 'E.1', 'Encryption at rest and in transit (Rule 6(a))', 'critical', 'System Config', false, 0),
('d0000000-0000-0000-0000-00000000000e', 'E.2', 'RBAC + periodic review + MFA (Rule 6(b)(c))', 'critical', 'System Config', false, 1),
('d0000000-0000-0000-0000-00000000000e', 'E.3', 'Access/processing logs ≥1 year, tamper-resistant (Rule 6(e))', 'critical', 'System Config', false, 2),
('d0000000-0000-0000-0000-00000000000e', 'E.4', 'Masking/tokenisation/anonymisation (Rule 6(a))', 'high', 'System Config', false, 3),
('d0000000-0000-0000-0000-00000000000e', 'E.5', 'Backups with integrity + tested restoration (Rule 6(d))', 'high', 'System Config', false, 4),
('d0000000-0000-0000-0000-00000000000e', 'E.6', 'Annual VAPT minimum (Rule 6(g))', 'high', 'Report', false, 5),
('d0000000-0000-0000-0000-00000000000e', 'E.7', 'Approved Information Security Policy (Rule 6(f))', 'high', 'Policy Document', false, 6),
('d0000000-0000-0000-0000-00000000000e', 'E.8', 'Continuous safeguard review (Rule 6(h))', 'high', 'Report', false, 7),
('d0000000-0000-0000-0000-00000000000f', 'F.1', 'Approved Breach Response Plan', 'critical', 'Policy Document', false, 0),
('d0000000-0000-0000-0000-00000000000f', 'F.2', 'Named breach team, escalation, 24/7 chain', 'critical', 'SOP', false, 1),
('d0000000-0000-0000-0000-00000000000f', 'F.3', 'Classification framework with SLAs per level', 'high', 'SOP', false, 2),
('d0000000-0000-0000-0000-00000000000f', 'F.4', 'Board notification template per Rule 7(2)', 'critical', 'Template', false, 3),
('d0000000-0000-0000-0000-00000000000f', 'F.5', 'Individual notification template per Rule 7(1)', 'critical', 'Template', false, 4),
('d0000000-0000-0000-0000-00000000000f', 'F.6', 'Detection: SIEM, IDS/IPS, alerting, monitoring', 'critical', 'System Config', false, 5),
('d0000000-0000-0000-0000-00000000000f', 'F.7', 'Processor breach SLA in contracts', 'high', 'Contract', false, 6),
('d0000000-0000-0000-0000-00000000000f', 'F.8', 'Evidence preservation: forensics, chain of custody', 'high', 'SOP', false, 7),
('d0000000-0000-0000-0000-00000000000f', 'F.9', 'Breach simulation/tabletop in last 12 months', 'high', 'Report', false, 8),
('d0000000-0000-0000-0000-00000000000f', 'F.10', 'Post-incident: RCA, lessons learned, actions tracked', 'high', 'Report', false, 9),
('d0000000-0000-0000-0000-000000000010', 'G.1', 'Published mechanism for access, correction, erasure, grievance (Rule 14(1))', 'critical', 'System/Platform', false, 0),
('d0000000-0000-0000-0000-000000000010', 'G.2', 'Identity verification before acting (Rule 14(1)(b))', 'high', 'SOP', false, 1),
('d0000000-0000-0000-0000-000000000010', 'G.3', 'Grievance redress ≤90 days (Sec 13), tracking', 'critical', 'System/Platform', false, 2),
('d0000000-0000-0000-0000-000000000010', 'G.4', 'End-to-end rights request tracking', 'high', 'System/Platform', false, 3),
('d0000000-0000-0000-0000-000000000010', 'G.5', 'Nomination for death/incapacity (Sec 14)', 'standard', 'SOP', false, 4),
('d0000000-0000-0000-0000-000000000011', 'H.1', 'Retention Policy with category-wise periods', 'high', 'Policy Document', false, 0),
('d0000000-0000-0000-0000-000000000011', 'H.2', 'Retention schedule per category: purpose, basis, max period', 'critical', 'Register', false, 1),
('d0000000-0000-0000-0000-000000000011', 'H.3', 'Automated/scheduled retention enforcement', 'high', 'System Config', false, 2),
('d0000000-0000-0000-0000-000000000011', 'H.4', 'Permanent irreversible erasure — production, backups, processors', 'high', 'SOP', false, 3),
('d0000000-0000-0000-0000-000000000011', 'H.5', 'Third Schedule: 48-hr pre-erasure notice', 'high', 'SOP', false, 4),
('d0000000-0000-0000-0000-000000000011', 'H.6', 'Processing/retention logs ≥3 years (Rule 8(3))', 'critical', 'System Config', false, 5),
('d0000000-0000-0000-0000-000000000012', 'I.1', 'Age verification/age-gating (Rule 10)', 'critical', 'System/Platform', false, 0),
('d0000000-0000-0000-0000-000000000012', 'I.2', 'Verifiable parental consent with records', 'critical', 'System/Platform', false, 1),
('d0000000-0000-0000-0000-000000000012', 'I.3', 'Tracking/profiling/targeting DISABLED for children (Sec 9(2))', 'critical', 'System Config', false, 2),
('d0000000-0000-0000-0000-000000000012', 'I.4', 'Fourth Schedule exemption: documented justification', 'high', 'Report', false, 3),
('d0000000-0000-0000-0000-000000000013', 'J.1', 'Processor contracts with DPDP clauses (Sec 8(4))', 'critical', 'Contract', false, 0),
('d0000000-0000-0000-0000-000000000013', 'J.2', 'Processor due diligence at onboarding + periodic', 'high', 'Report', false, 1),
('d0000000-0000-0000-0000-000000000013', 'J.3', 'Processor register maintained', 'high', 'Register', false, 2),
('d0000000-0000-0000-0000-000000000013', 'J.4', 'Sub-processing restricted without DF approval', 'high', 'Contract', false, 3),
('d0000000-0000-0000-0000-000000000013', 'J.5', 'Processor deletes/returns data on termination (Sec 8(8))', 'critical', 'Contract', false, 4),
('d0000000-0000-0000-0000-000000000013', 'J.6', 'Cross-border: flow map, restriction check (Sec 16(2))', 'high', 'Register', false, 5),
('d0000000-0000-0000-0000-000000000014', 'K.1', 'Written contract with each DF client', 'critical', 'Contract', false, 0),
('d0000000-0000-0000-0000-000000000014', 'K.2', 'Processing ONLY within DF instructions', 'critical', 'SOP', false, 1),
('d0000000-0000-0000-0000-000000000014', 'K.3', 'Security per DF contract requirements', 'critical', 'Report', false, 2),
('d0000000-0000-0000-0000-000000000014', 'K.4', 'Breach notification to DF within SLA', 'critical', 'SOP', false, 3),
('d0000000-0000-0000-0000-000000000014', 'K.5', 'Data deleted/returned on termination', 'critical', 'SOP', false, 4),
('d0000000-0000-0000-0000-000000000014', 'K.6', 'No sub-processing without DF approval', 'high', 'Contract', false, 5),
('d0000000-0000-0000-0000-000000000015', 'L.1', 'DPO appointed, published contact (Sec 8(9), Rule 9)', 'critical', 'Letter', false, 0),
('d0000000-0000-0000-0000-000000000015', 'L.2', 'RoPA covering all operations', 'critical', 'Register', false, 1),
('d0000000-0000-0000-0000-000000000015', 'L.3', 'Privacy governance structure with Board accountability', 'high', 'Report', false, 2),
('d0000000-0000-0000-0000-000000000015', 'L.4', 'Govt info request SOP (Sec 36, Rule 23)', 'high', 'SOP', false, 3),
('d0000000-0000-0000-0000-000000000015', 'L.5', 'Awareness of voluntary undertaking (Sec 26) + appellate (Sec 27–31)', 'standard', 'Report', false, 4),
('d0000000-0000-0000-0000-000000000015', 'L.6', 'Change management triggers privacy reassessment', 'high', 'SOP', false, 5),
('d0000000-0000-0000-0000-000000000015', 'L.7', '[SDF only] Annual DPIA by qualified auditor', 'critical', 'Report', true, 6),
('d0000000-0000-0000-0000-000000000015', 'L.8', '[SDF only] Independent DPDP audit annually', 'critical', 'Report', true, 7),
('d0000000-0000-0000-0000-000000000015', 'L.9', '[SDF only] Algorithmic risk due diligence (Rule 13(3))', 'high', 'Report', true, 8),
('d0000000-0000-0000-0000-000000000015', 'L.10', '[SDF only] Data localisation (Rule 13(4))', 'high', 'Report', true, 9),
('d0000000-0000-0000-0000-000000000016', 'M.1', 'Registered with Board as CM', 'critical', 'Certificate', false, 0),
('d0000000-0000-0000-0000-000000000016', 'M.2', 'Interoperable platform across DFs (Rule 5)', 'critical', 'System/Platform', false, 1),
('d0000000-0000-0000-0000-000000000016', 'M.3', 'Single point of contact for DPs', 'critical', 'SOP', false, 2),
('d0000000-0000-0000-0000-000000000016', 'M.4', 'Consent artefacts with fiduciary-level security', 'high', 'System Config', false, 3),
('d0000000-0000-0000-0000-000000000017', 'N.1', 'All PD-handling employees trained with completion records', 'high', 'Report', false, 0),
('d0000000-0000-0000-0000-000000000017', 'N.2', 'Privacy in new-joiner onboarding', 'high', 'SOP', false, 1),
('d0000000-0000-0000-0000-000000000017', 'N.3', 'Department-specific training', 'high', 'Report', false, 2),
('d0000000-0000-0000-0000-000000000017', 'N.4', 'Annual refresher with tracked completion', 'high', 'Report', false, 3),
('d0000000-0000-0000-0000-000000000017', 'N.5', 'Board/executive awareness session', 'high', 'Report', false, 4),
('d0000000-0000-0000-0000-000000000017', 'N.6', 'Third-party contractors/temp staff: privacy acknowledgement', 'standard', 'Report', false, 5),
('d0000000-0000-0000-0000-000000000018', 'O.1', 'Proactive not Reactive — privacy risk assessments conducted before new processing, products, or systems', 'critical', 'Assessment Record', false, 0),
('d0000000-0000-0000-0000-000000000018', 'O.2', 'Privacy as Default Setting — data collection limited to minimum by default; no user action required for maximum privacy', 'critical', 'System Config', false, 1),
('d0000000-0000-0000-0000-000000000018', 'O.3', 'Privacy Embedded into Design — privacy controls integrated into system architecture, not bolted on', 'high', 'Architecture Doc', false, 2),
('d0000000-0000-0000-0000-000000000018', 'O.4', 'Full Functionality — positive-sum approach; privacy not traded off against functionality or security', 'standard', 'Assessment Record', false, 3),
('d0000000-0000-0000-0000-000000000018', 'O.5', 'End-to-End Security — data protected throughout its entire lifecycle from collection to deletion', 'high', 'System Config', false, 4),
('d0000000-0000-0000-0000-000000000018', 'O.6', 'Visibility and Transparency — processing activities are verifiable and auditable by data principals and regulators', 'high', 'Report', false, 5),
('d0000000-0000-0000-0000-000000000018', 'O.7', 'Respect for Data Principal — user-centric design with strong defaults, clear notices, and empowerment features', 'high', 'UI/UX Review', false, 6),
('d0000000-0000-0000-0000-000000000018', 'O.8', 'Privacy impact documented for all new projects, features, and vendor integrations before launch', 'critical', 'Report', false, 7);

-- Default template
INSERT INTO public.assessment_templates (id, name, description, template_type, is_default, is_active)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'DPDP Full Assessment',
  'Complete assessment covering all 15 domains and 88 requirements of the Digital Personal Data Protection Act, 2023.',
  'single',
  true,
  true
);

INSERT INTO public.assessment_template_frameworks (template_id, framework_id)
VALUES ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001');