
-- Admin can SELECT all assessments
CREATE POLICY "Admins can select all assessments" ON public.assessments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can UPDATE all assessments
CREATE POLICY "Admins can update all assessments" ON public.assessments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can DELETE all assessments
CREATE POLICY "Admins can delete all assessments" ON public.assessments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can SELECT all assessment_checks
CREATE POLICY "Admins can select all assessment_checks" ON public.assessment_checks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can INSERT assessment_checks
CREATE POLICY "Admins can insert assessment_checks" ON public.assessment_checks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can UPDATE all assessment_checks
CREATE POLICY "Admins can update all assessment_checks" ON public.assessment_checks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can DELETE all assessment_checks
CREATE POLICY "Admins can delete all assessment_checks" ON public.assessment_checks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can SELECT all policy_items
CREATE POLICY "Admins can select all policy_items" ON public.policy_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can INSERT policy_items
CREATE POLICY "Admins can insert policy_items" ON public.policy_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can UPDATE all policy_items
CREATE POLICY "Admins can update all policy_items" ON public.policy_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can DELETE all policy_items
CREATE POLICY "Admins can delete all policy_items" ON public.policy_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can SELECT all dept_grid
CREATE POLICY "Admins can select all dept_grid" ON public.dept_grid FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can INSERT dept_grid
CREATE POLICY "Admins can insert dept_grid" ON public.dept_grid FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can UPDATE all dept_grid
CREATE POLICY "Admins can update all dept_grid" ON public.dept_grid FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can DELETE all dept_grid
CREATE POLICY "Admins can delete all dept_grid" ON public.dept_grid FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can SELECT all shared_reports
CREATE POLICY "Admins can select all shared_reports" ON public.shared_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can UPDATE all shared_reports
CREATE POLICY "Admins can update all shared_reports" ON public.shared_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can DELETE all shared_reports
CREATE POLICY "Admins can delete all shared_reports" ON public.shared_reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can SELECT all file_references
CREATE POLICY "Admins can select all file_references" ON public.file_references FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can INSERT file_references
CREATE POLICY "Admins can insert file_references" ON public.file_references FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can UPDATE all file_references
CREATE POLICY "Admins can update file_references" ON public.file_references FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can DELETE all file_references
CREATE POLICY "Admins can delete all file_references" ON public.file_references FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can SELECT all assessment_versions
CREATE POLICY "Admins can select all assessment_versions" ON public.assessment_versions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can INSERT assessment_versions
CREATE POLICY "Admins can insert assessment_versions" ON public.assessment_versions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can UPDATE all assessment_versions
CREATE POLICY "Admins can update assessment_versions" ON public.assessment_versions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can DELETE all assessment_versions
CREATE POLICY "Admins can delete assessment_versions" ON public.assessment_versions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin can SELECT all profiles
CREATE POLICY "Admins can select all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
