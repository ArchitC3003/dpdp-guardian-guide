-- Reverses drizzle/migrations/0015_cmp_schema.sql.
--
-- DROP SCHEMA ... CASCADE also removes objects in OTHER schemas that depend on cmp (a view over a
-- cmp table, a foreign key to one, a policy or trigger that calls a cmp function, a column of a cmp
-- type). This script therefore checks first and REFUSES, changing nothing, if anything outside cmp
-- depends on it or would be left broken. It lists what it found; remove or repoint those objects
-- deliberately, then run it again. There is no override.
--
-- The check and the drop run in one block, so they succeed or fail together.

DO $rollback$
DECLARE
  ns oid := (SELECT oid FROM pg_namespace WHERE nspname = 'cmp');
  found text;
BEGIN
  IF ns IS NULL THEN
    RAISE EXCEPTION 'cmp rollback: schema cmp does not exist' USING ERRCODE = '3F000';
  END IF;

  -- 1. Objects outside cmp that the catalogue records as depending on something in cmp.
  --    Each side of a dependency is mapped to the schema it lives in; a kind this query cannot
  --    place is treated as outside cmp, so the script errs towards refusing.
  WITH placed AS (
    SELECT d.classid, d.objid, d.objsubid, d.refclassid, d.refobjid,
      CASE d.classid
        WHEN 'pg_class'::regclass      THEN (SELECT relnamespace FROM pg_class WHERE oid = d.objid)
        WHEN 'pg_proc'::regclass       THEN (SELECT pronamespace FROM pg_proc WHERE oid = d.objid)
        WHEN 'pg_type'::regclass       THEN (SELECT typnamespace FROM pg_type WHERE oid = d.objid)
        WHEN 'pg_constraint'::regclass THEN (SELECT COALESCE(c.relnamespace, k.connamespace) FROM pg_constraint k LEFT JOIN pg_class c ON c.oid = k.conrelid WHERE k.oid = d.objid)
        WHEN 'pg_trigger'::regclass    THEN (SELECT c.relnamespace FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid WHERE t.oid = d.objid)
        WHEN 'pg_policy'::regclass     THEN (SELECT c.relnamespace FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid WHERE p.oid = d.objid)
        WHEN 'pg_rewrite'::regclass    THEN (SELECT c.relnamespace FROM pg_rewrite r JOIN pg_class c ON c.oid = r.ev_class WHERE r.oid = d.objid)
        WHEN 'pg_attrdef'::regclass    THEN (SELECT c.relnamespace FROM pg_attrdef a JOIN pg_class c ON c.oid = a.adrelid WHERE a.oid = d.objid)
        WHEN 'pg_namespace'::regclass  THEN d.objid
      END AS dep_ns,
      CASE d.refclassid
        WHEN 'pg_class'::regclass      THEN (SELECT relnamespace FROM pg_class WHERE oid = d.refobjid)
        WHEN 'pg_proc'::regclass       THEN (SELECT pronamespace FROM pg_proc WHERE oid = d.refobjid)
        WHEN 'pg_type'::regclass       THEN (SELECT typnamespace FROM pg_type WHERE oid = d.refobjid)
        WHEN 'pg_constraint'::regclass THEN (SELECT COALESCE(c.relnamespace, k.connamespace) FROM pg_constraint k LEFT JOIN pg_class c ON c.oid = k.conrelid WHERE k.oid = d.refobjid)
        WHEN 'pg_namespace'::regclass  THEN d.refobjid
      END AS ref_ns
    FROM pg_depend d
    -- normal and automatic dependencies only: internal ones (TOAST tables, row types) are parts
    -- of their owning object, not separate dependants
    WHERE d.deptype IN ('n', 'a')
  )
  SELECT string_agg(DISTINCT pg_describe_object(classid, objid, objsubid), '; ' ORDER BY pg_describe_object(classid, objid, objsubid))
    INTO found
  FROM placed
  WHERE ref_ns = ns AND dep_ns IS DISTINCT FROM ns;

  IF found IS NOT NULL THEN
    RAISE EXCEPTION 'cmp rollback refused: objects outside cmp depend on it and would be dropped: %', found
      USING ERRCODE = '2BP01', HINT = 'Remove or repoint these objects deliberately, then run the rollback again.';
  END IF;

  -- 2. Routines outside cmp whose body mentions cmp. The catalogue does not track these, so CASCADE
  --    would not drop them; it would leave them broken. Refuse for the same reason.
  SELECT string_agg(p.oid::regprocedure::text, '; ' ORDER BY p.oid::regprocedure::text) INTO found
  FROM pg_proc p
  WHERE p.pronamespace <> ns
    AND p.pronamespace NOT IN (SELECT oid FROM pg_namespace WHERE nspname IN ('pg_catalog', 'information_schema'))
    AND p.prosrc ~* '\mcmp\.[a-z_]';

  IF found IS NOT NULL THEN
    RAISE EXCEPTION 'cmp rollback refused: routines outside cmp refer to it and would be left broken: %', found
      USING ERRCODE = '2BP01', HINT = 'Remove or repoint these routines deliberately, then run the rollback again.';
  END IF;

  SET LOCAL client_min_messages = warning;
  DROP SCHEMA cmp CASCADE;
END $rollback$;
