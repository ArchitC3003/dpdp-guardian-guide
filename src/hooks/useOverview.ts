import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  GRIEVANCE_CLOSED, LEGACY_DOMAINS, PROCESSOR_HIDDEN_CODES, RIGHTS_CLOSED,
  grievanceDeadline, policyCounts, slaCounts, summarise,
  type CheckLite, type OverviewDomain, type PolicyCounts, type Posture, type Risk, type SlaCounts, type SpecialFlags,
} from "@/lib/overview";

export interface AssessmentPosture {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  /** Short names of the frameworks assessed, e.g. "DPDP Act 2023". */
  frameworks: string[];
  /** True when the signed-in person created it. */
  mine: boolean;
  posture: Posture;
}

/** The last thing the signed-in person worked on in a tool, for a "resume" link. */
export interface LastItem { id: string; name: string }

export interface Overview {
  assessments: AssessmentPosture[];
  policies: PolicyCounts;
  lastPolicy: LastItem | null;
  workspaces: number;
  lastWorkspace: LastItem | null;
  /** Null when the signed-in person cannot see privacy operations. */
  rights: SlaCounts | null;
  grievances: SlaCounts | null;
}

const PAGE = 1000;

/** Read every row of a query, a page at a time, since one request returns at most 1000 rows. */
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>, maxPages = 20): Promise<T[]> {
  const rows: T[] = [];
  for (let i = 0; i < maxPages; i++) {
    const { data, error } = await page(i * PAGE, (i + 1) * PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

/** Run an `in (...)` query in batches, so a long id list never overflows the request URL. */
async function inBatches<T>(ids: string[], run: (batch: string[]) => Promise<T[]>, size = 100): Promise<T[]> {
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += size) batches.push(ids.slice(i, i + size));
  return (await Promise.all(batches.map(run))).flat();
}

async function loadOverview(userId: string, includeOps: boolean): Promise<Overview> {
  const [assessmentsRes, policiesRes, workspacesRes] = await Promise.all([
    supabase.from("assessments").select("id, user_id, org_name, status, updated_at, framework_ids, special_status, dpdp_role").order("updated_at", { ascending: false }),
    supabase.from("policy_documents").select("id, user_id, title, status, review_date").order("updated_at", { ascending: false }),
    supabase.from("execute_workspaces").select("id, user_id, org_name").order("updated_at", { ascending: false }),
  ]);
  if (assessmentsRes.error) throw assessmentsRes.error;
  const assessments = assessmentsRes.data ?? [];
  const ids = assessments.map((a) => a.id);
  const frameworkIds = [...new Set(assessments.flatMap((a) => a.framework_ids ?? []))];

  const [checks, frameworks, domainRows] = await Promise.all([
    inBatches(ids, (batch) =>
      fetchAll((from, to) => supabase.from("assessment_checks").select("assessment_id, check_id, status, priority, evidence_status").in("assessment_id", batch).order("id").range(from, to))),
    frameworkIds.length
      ? supabase.from("assessment_frameworks").select("id, short_code").in("id", frameworkIds).then((r) => r.data ?? [])
      : Promise.resolve([]),
    frameworkIds.length
      ? supabase.from("framework_domains").select("id, framework_id, code, name, penalty_ref, conditional_flag").in("framework_id", frameworkIds).eq("is_active", true).order("display_order").then((r) => r.data ?? [])
      : Promise.resolve([]),
  ]);
  const domainIds = domainRows.map((d) => d.id);
  const requirements = await inBatches(domainIds, (batch) =>
    fetchAll((from, to) => supabase.from("framework_requirements").select("id, domain_id, item_code, description, risk_level, sdf_only").in("domain_id", batch).eq("is_active", true).order("display_order").order("id").range(from, to)));

  const domainsByFramework = new Map<string, OverviewDomain[]>();
  for (const d of domainRows) {
    const list = domainsByFramework.get(d.framework_id) ?? [];
    list.push({
      code: d.code, name: d.name, penalty: d.penalty_ref ?? undefined, conditional: d.conditional_flag ?? undefined,
      items: requirements.filter((r) => r.domain_id === d.id).map((r) => ({ id: r.item_code, description: r.description, risk: r.risk_level as Risk, sdfOnly: r.sdf_only })),
    });
    domainsByFramework.set(d.framework_id, list);
  }
  const shortCode = new Map<string, string>();
  for (const f of frameworks as { id: string; short_code: string }[]) shortCode.set(f.id, f.short_code);
  const checksByAssessment = new Map<string, CheckLite[]>();
  for (const c of checks) {
    const list = checksByAssessment.get(c.assessment_id) ?? [];
    list.push(c);
    checksByAssessment.set(c.assessment_id, list);
  }

  const postures: AssessmentPosture[] = assessments.map((a) => {
    const fwIds = a.framework_ids ?? [];
    let domains = fwIds.length ? fwIds.flatMap((id) => domainsByFramework.get(id) ?? []) : LEGACY_DOMAINS;
    if (a.dpdp_role === "data_processor") domains = domains.filter((d) => !PROCESSOR_HIDDEN_CODES.has(d.code));
    return {
      id: a.id,
      name: a.org_name?.trim() || "Untitled assessment",
      status: a.status,
      updatedAt: a.updated_at,
      mine: a.user_id === userId,
      frameworks: fwIds.length ? fwIds.map((id) => shortCode.get(id)).filter((s): s is string => !!s) : ["DPDP Act 2023"],
      posture: summarise(domains, checksByAssessment.get(a.id) ?? [], (a.special_status ?? {}) as SpecialFlags),
    };
  });

  let rights: SlaCounts | null = null, grievances: SlaCounts | null = null;
  if (includeOps) {
    const [r, g] = await Promise.all([
      supabase.from("rights_requests").select("status, sla_deadline"),
      supabase.from("grievances").select("status, sla_deadline_ack, sla_deadline_resolution"),
    ]);
    if (!r.error) rights = slaCounts((r.data ?? []).map((x) => ({ status: x.status, deadline: x.sla_deadline })), RIGHTS_CLOSED);
    if (!g.error) grievances = slaCounts((g.data ?? []).map((x) => ({ status: x.status, deadline: grievanceDeadline(x) })), GRIEVANCE_CLOSED);
  }

  const policies = policiesRes.data ?? [];
  const workspaces = workspacesRes.data ?? [];
  const myPolicy = policies.find((x) => x.user_id === userId);
  const myWorkspace = workspaces.find((x) => x.user_id === userId);
  return {
    assessments: postures,
    policies: policyCounts(policies),
    lastPolicy: myPolicy ? { id: myPolicy.id, name: myPolicy.title } : null,
    workspaces: workspaces.length,
    lastWorkspace: myWorkspace ? { id: myWorkspace.id, name: myWorkspace.org_name } : null,
    rights, grievances,
  };
}

/** Everything the signed-in overview shows, read live. `includeOps` adds rights requests and grievances. */
export function useOverview(userId: string | undefined, enabled: boolean, includeOps: boolean) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !userId) return;
    let live = true;
    setError(false);
    loadOverview(userId, includeOps)
      .then((d) => { if (live) setData(d); })
      .catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [userId, enabled, includeOps, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { data, error, loading: !data && !error, retry };
}
