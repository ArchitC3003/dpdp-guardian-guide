import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useOverview, type AssessmentPosture } from "@/hooks/useOverview";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RequirementMap } from "@/components/dashboard/RequirementMap";
import { ProgrammeTrail } from "@/components/dashboard/ProgrammeTrail";
import { bandFor, plural, type Cell, type SlaCounts } from "@/lib/overview";
import { cn } from "@/lib/utils";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function Section({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-serif text-xl">{title}</h2>
        {aside && <div className="text-sm text-muted-foreground">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

const TextLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="font-medium text-primary underline-offset-4 hover:underline focus-visible:underline">{children}</Link>
);

/** The sentence that opens the page: where the assessment in view stands. */
function headline(a: AssessmentPosture): { title: string; detail: string } {
  const p = a.posture;
  if (p.answered === 0) {
    return {
      title: `${a.name} has not answered any requirements yet.`,
      detail: `${plural(p.applicable, "requirement")} apply. Answer them to see where you stand and what to close first.`,
    };
  }
  const parts = [
    p.gap ? `${p.gap} ${p.gap === 1 ? "is" : "are"} not met${p.criticalGaps ? `, ${p.criticalGaps} of them critical` : ""}` : "None are marked not met",
    p.partial ? `${p.partial} ${p.partial === 1 ? "is" : "are"} partly met` : "",
    p.open ? `${p.open} ${p.open === 1 ? "is" : "are"} still unanswered` : "",
  ].filter(Boolean);
  return { title: `${a.name} meets ${p.met} of ${plural(p.applicable, "requirement")}.`, detail: `${parts.join(". ")}.` };
}

const RISK_LABEL = { critical: "Critical risk", high: "High risk", standard: "Standard risk" } as const;

function GapList({ gaps, href }: { gaps: Cell[]; href: string }) {
  return (
    <ol className="border-t border-border">
      {gaps.map((g, i) => (
        <li key={g.id} className="border-b border-border">
          <Link to={href} className="-mx-2 flex gap-4 rounded-md px-2 py-3 transition-colors hover:bg-card focus-visible:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
            <span className="w-5 shrink-0 font-serif text-lg leading-6 text-muted-foreground tabular-nums">{i + 1}</span>
            <span className="min-w-0">
              <span className="block text-sm leading-6 line-clamp-2">{g.description}</span>
              <span className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                <span>{g.domainName}</span>
                <span className={cn(g.risk === "critical" && "font-semibold text-[hsl(var(--coral))]")}>{RISK_LABEL[g.risk]}</span>
                <span>{g.state === "gap" ? "Not met" : "Partly met"}</span>
                {g.priority && <span>{g.priority.replace("–", ", ")}</span>}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function OpsRow({ label, to, counts }: { label: string; to: string; counts: SlaCounts }) {
  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-sm">
      <TextLink to={to}>{label}</TextLink>
      <span className="text-right text-muted-foreground">
        {counts.open === 0 ? "None open" : (
          <>
            {counts.open} open
            {counts.overdue > 0 && <span className="font-semibold text-[hsl(var(--coral))]">, {counts.overdue} overdue</span>}
            {counts.dueSoon > 0 && <>, {counts.dueSoon} due within 7 days</>}
          </>
        )}
      </span>
    </li>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading overview">
      <div className="h-10 w-2/3 animate-pulse rounded-md bg-muted" />
      <div className="h-5 w-1/2 animate-pulse rounded-md bg-muted" />
      <div className="h-72 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { userRoleLabel, canManageUsers, canCreate, loading: roleLoading } = usePermissions();
  const { data, error, loading, retry } = useOverview(!!user && !roleLoading, canManageUsers);
  const [focusId, setFocusId] = useState<string | null>(null);

  const context = [profile?.organisation, userRoleLabel].filter(Boolean).join(", ");

  if (error) {
    return (
      <div className="max-w-xl space-y-4 py-8">
        <h1 className="font-serif text-3xl">The overview could not be loaded.</h1>
        <p className="text-muted-foreground">Your data is unchanged. Check your connection and load it again.</p>
        <Button onClick={retry}>Load again</Button>
      </div>
    );
  }
  if (loading || !data) return <Skeleton />;

  const focus = data.assessments.find((a) => a.id === focusId) ?? data.assessments[0];
  const inProgress = data.assessments.filter((a) => a.status !== "Completed").length;
  const trail = <ProgrammeTrail assessments={data.assessments.length} inProgress={inProgress} policies={data.policies} workspaces={data.workspaces} />;
  const ops = (data.rights || data.grievances) && (
    <Section title="Requests from people" className="mt-10">
      <ul className="border-t border-border">
        {data.rights && <OpsRow label="Rights requests" to="/consent/rights-desk" counts={data.rights} />}
        {data.grievances && <OpsRow label="Grievances" to="/consent/grievances" counts={data.grievances} />}
      </ul>
    </Section>
  );

  if (!focus) {
    return (
      <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
        <div className="max-w-xl space-y-4">
          {context && <p className="text-sm text-muted-foreground">{context}</p>}
          <h1 className="font-serif text-4xl leading-tight">Start with a gap assessment.</h1>
          <p className="text-muted-foreground">
            Answer the requirements that apply to your organisation. This page then shows where you stand, requirement by requirement, and what to close first.
          </p>
          <Button asChild><Link to="/assessments">{canCreate ? "Start an assessment" : "Open assessments"}</Link></Button>
        </div>
        <div>
          <Section title="Your programme">{trail}</Section>
          {ops}
        </div>
      </div>
    );
  }

  const p = focus.posture;
  const { title, detail } = headline(focus);
  const assessHref = `/assessment/${focus.id}/rapid-assessment`;
  const resultsHref = `/assessment/${focus.id}/dashboard`;

  return (
    <div className="space-y-12">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{context || "Overview"}</p>
          {data.assessments.length > 1 && (
            <Select value={focus.id} onValueChange={setFocusId}>
              <SelectTrigger className="w-full sm:w-72" aria-label="Assessment in view"><SelectValue /></SelectTrigger>
              <SelectContent>
                {data.assessments.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="mt-5 grid items-end gap-x-12 gap-y-6 lg:grid-cols-[1fr_auto]">
          <div>
            <h1 className="max-w-[22ch] font-serif text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.12] tracking-tight [text-wrap:balance]">{title}</h1>
            <p className="mt-4 max-w-[62ch] text-base text-muted-foreground">{detail}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild><Link to={assessHref}>{p.open > 0 ? "Continue the assessment" : "Review the answers"}</Link></Button>
              <Button asChild variant="outline"><Link to={resultsHref}>Open full results</Link></Button>
            </div>
          </div>
          {p.score !== null && (
            <div className="lg:text-right">
              <p className="font-serif text-6xl leading-none">{p.score}<span className="text-3xl">%</span></p>
              <p className="mt-2 text-sm font-semibold">{bandFor(p.score)}</p>
              <p className="text-sm text-muted-foreground">Readiness, weighted by risk</p>
            </div>
          )}
        </div>
      </header>

      <Section
        title="Every requirement, by area"
        aside={<>{focus.frameworks.join(", ")}, updated {day(focus.updatedAt)}</>}
      >
        <RequirementMap posture={p} href={assessHref} />
        {p.answered > 0 && p.unverified > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {plural(p.unverified, "answer")} {p.unverified === 1 ? "rests" : "rest"} on evidence that has not been seen and verified.
          </p>
        )}
      </Section>

      <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-12">
          <Section title="Close these first" aside={p.topGaps.length > 0 && "Ordered by priority, then risk"}>
            {p.topGaps.length > 0 ? <GapList gaps={p.topGaps} href={assessHref} /> : (
              <p className="text-sm text-muted-foreground">
                {p.answered === 0 ? "Gaps appear here once requirements are answered." : "Nothing is marked not met or partly met."}
              </p>
            )}
          </Section>

          {data.assessments.length > 1 && (
            <Section title="All assessments" aside={<TextLink to="/assessments">Manage assessments</TextLink>}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Organisation</th>
                      <th className="py-2 pr-4 font-medium">Readiness</th>
                      <th className="py-2 pr-4 font-medium text-right">Not met</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 font-medium text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assessments.map((a) => (
                      <tr key={a.id} className={cn("border-b border-border", a.id === focus.id && "bg-card")}>
                        <td className="max-w-[16rem] truncate py-2.5 pr-4 pl-2"><TextLink to={`/assessment/${a.id}/dashboard`}>{a.name}</TextLink></td>
                        <td className="py-2.5 pr-4">
                          {a.posture.score === null ? <span className="text-muted-foreground">Not started</span> : (
                            <span className="flex items-center gap-3">
                              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                                <span className="block h-full rounded-full bg-primary" style={{ width: `${a.posture.score}%` }} />
                              </span>
                              <span className="tabular-nums">{a.posture.score}%</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">{a.posture.gap}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{a.status}</td>
                        <td className="py-2.5 pr-2 text-right text-muted-foreground whitespace-nowrap">{day(a.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>

        <div>
          <Section title="Your programme">{trail}</Section>
          {data.policies.reviewOverdue > 0 && (
            <p className="mt-6 border-l-2 border-[hsl(var(--coral))] pl-3 text-sm">
              {plural(data.policies.reviewOverdue, "policy", "policies")} {data.policies.reviewOverdue === 1 ? "is" : "are"} past the review date.{" "}
              <TextLink to="/policy-library">Open the policy register</TextLink>
            </p>
          )}
          {ops}
        </div>
      </div>
    </div>
  );
}
