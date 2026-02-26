
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  organisation TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Assessments table
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'In Progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  org_name TEXT DEFAULT '',
  org_industry TEXT DEFAULT '',
  org_entity_type TEXT DEFAULT '',
  org_employees TEXT DEFAULT '',
  org_data_subjects TEXT DEFAULT '',
  org_locations TEXT DEFAULT '',
  org_regulators TEXT DEFAULT '',
  special_status JSONB DEFAULT '{"sdf":false,"consentMgr":false,"children":false,"crossBorder":false,"legacy":false,"thirdSchedule":false,"intermediary":false,"startup":false}'::jsonb,
  notes TEXT DEFAULT ''
);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own assessments" ON public.assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessments" ON public.assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assessments" ON public.assessments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assessments" ON public.assessments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assessment checks table
CREATE TABLE public.assessment_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  check_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT,
  evidence_status TEXT,
  priority TEXT,
  owner TEXT DEFAULT '',
  observation TEXT DEFAULT ''
);
ALTER TABLE public.assessment_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own assessment_checks" ON public.assessment_checks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own assessment_checks" ON public.assessment_checks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own assessment_checks" ON public.assessment_checks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own assessment_checks" ON public.assessment_checks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);

-- Policy items table
CREATE TABLE public.policy_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  status TEXT,
  approved TEXT,
  review_cycle TEXT,
  last_reviewed TEXT DEFAULT '',
  observation TEXT DEFAULT ''
);
ALTER TABLE public.policy_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own policy_items" ON public.policy_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own policy_items" ON public.policy_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own policy_items" ON public.policy_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own policy_items" ON public.policy_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);

-- Department grid table
CREATE TABLE public.dept_grid (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  control_id INTEGER NOT NULL,
  department TEXT NOT NULL,
  status TEXT
);
ALTER TABLE public.dept_grid ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own dept_grid" ON public.dept_grid FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own dept_grid" ON public.dept_grid FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own dept_grid" ON public.dept_grid FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own dept_grid" ON public.dept_grid FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);

-- File references table
CREATE TABLE public.file_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  file_path TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.file_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own file_references" ON public.file_references FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own file_references" ON public.file_references FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own file_references" ON public.file_references FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);

-- Assessment versions table
CREATE TABLE public.assessment_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.assessment_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own assessment_versions" ON public.assessment_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own assessment_versions" ON public.assessment_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.assessments WHERE id = assessment_id AND user_id = auth.uid())
);

-- Shared reports table
CREATE TABLE public.shared_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id),
  share_code TEXT NOT NULL UNIQUE,
  shared_by UUID REFERENCES auth.users(id),
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own shared_reports" ON public.shared_reports FOR SELECT USING (auth.uid() = shared_by);
CREATE POLICY "Users can insert own shared_reports" ON public.shared_reports FOR INSERT WITH CHECK (auth.uid() = shared_by);
CREATE POLICY "Anyone can view active shared reports by code" ON public.shared_reports FOR SELECT USING (is_active = true);

-- Public read access for shared report data
CREATE POLICY "Shared assessment read via share code" ON public.assessments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shared_reports WHERE assessment_id = id AND is_active = true)
);
CREATE POLICY "Shared assessment_checks read" ON public.assessment_checks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shared_reports WHERE assessment_id = assessment_checks.assessment_id AND is_active = true)
);
CREATE POLICY "Shared policy_items read" ON public.policy_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shared_reports WHERE assessment_id = policy_items.assessment_id AND is_active = true)
);
CREATE POLICY "Shared dept_grid read" ON public.dept_grid FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shared_reports WHERE assessment_id = dept_grid.assessment_id AND is_active = true)
);
CREATE POLICY "Shared file_references read" ON public.file_references FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shared_reports WHERE assessment_id = file_references.assessment_id AND is_active = true)
);
CREATE POLICY "Shared assessment_versions read" ON public.assessment_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shared_reports WHERE assessment_id = assessment_versions.assessment_id AND is_active = true)
);
