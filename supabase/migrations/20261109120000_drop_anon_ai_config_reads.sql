-- AI prompt configuration, training examples and the clause library were
-- readable by anyone holding the public key (anon SELECT USING (true)).
-- The generate-policy / policy-chat functions now read them with the service
-- role after authenticating the caller, so anonymous access is no longer needed.
DROP POLICY IF EXISTS "Service role can select ai_prompt_config" ON public.ai_prompt_config;
DROP POLICY IF EXISTS "Anon can select ai_training_examples" ON public.ai_training_examples;
DROP POLICY IF EXISTS "Anon can select framework_clause_library" ON public.framework_clause_library;
