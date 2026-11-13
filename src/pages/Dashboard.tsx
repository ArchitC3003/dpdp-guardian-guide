import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useOverview, type AssessmentPosture } from "@/hooks/useOverview";
import { Button } from "@/components/ui/button";
import { RequirementMap } from "@/components/dashboard/RequirementMap";
import { StageBoard } from "@/components/dashboard/StageBoard";
import { FeatureList } from "@/components/dashboard/FeatureList";
import { bandFor, plural, type Cell } from "@/lib/overview";
import { featureViews, stageReached, worstFirst, type WorkspaceFacts } from "@/lib/workspaceFeatures";
import { cn } from "@/lib/utils";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-3">
        <h2 className="font-serif text-2xl">{title}</h2>
        {aside && <div className="text-sm text-muted-foreground">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

const TextLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="font-medium text-primary underline-offset-4 hover:underline focus-visible:underline">{children}</Link>
);

/** Where one organisation's assessment stands, in a sentence. */
function standing(a: AssessmentPosture): { title: string; detail: string } {
  const p = a.posture;
  if (p.answered === 0) {
    return {
      title: `${a.name} has not answered any requirements yet.`,
      detail: `${plural(p.applicable, "requirement")} apply. Answer them to see where the organisation stands and what to close first.`,
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
            <span className="w-5 shrink-0 font-serif text-lg leading-6 text-muted-foreground">{i + 1}</span>
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

/** Every organisation assessed, weakest first. Choosing one shows its posture underneath. */
function OrganisationTable({ rows, focusId, onPick }: { rows: AssessmentPosture[]; focusId: string; onPick: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 pl-2 pr-4 font-medium">Organisation</th>
            <th className="py-2 pr-4 font-medium">Readiness</th>
            <th className="py-2 pr-4 font-medium text-right">Not met</th>
            <th className="py-2 pr-4 font-medium">Needs attention</th>
            <th className="py-2 pr-2 font-medium text-right">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const picked = a.id === focusId;
            return (
              <tr key={a.id} className={cn("border-b border-border", picked && "bg-card")}>
                <td className="max-w-[16rem] py-2.5 pl-2 pr-4">
                  <button
                    type="button"
                    aria-pressed={picked}
                    onClick={() => onPick(a.id)}
                    className={cn("max-w-full truncate text-left font-medium text-primary underline-offset-4 hover:underline focus-visible:underline", picked && "text-foreground")}
                  >
                    {a.name}
                  </button>
                </td>
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
                <td className="py-2.5 pr-4">
                  {a.posture.criticalGaps > 0
                    ? <span className="font-medium text-[hsl(var(--coral))]">{plural(a.posture.criticalGaps, "critical gap")}</span>
                    : <span className="text-muted-foreground">{a.posture.answered === 0 ? "No answers yet" : "Nothing critical"}</span>}
                </td>
                <td className="whitespace-nowrap py-2.5 pr-2 text-right text-muted-foreground">{day(a.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Posture({ a }: { a: AssessmentPosture }) {
  const p = a.posture;
  const { title, detail } = standing(a);
  const assessHref = `/assessment/${a.id}/rapid-assessment`;
  return (
    <div className="space-y-10">
      <div className="grid items-end gap-x-12 gap-y-6 lg:grid-cols-[1fr_auto]">
        <div>
          <h3 className="max-w-[26ch] font-serif text-[clamp(1.6rem,2.8vw,2.25rem)] leading-[1.15] tracking-tight [text-wrap:balance]">{title}</h3>
          <p className="mt-3 max-w-[62ch] text-muted-foreground">{detail}</p>
          <p className="mt-1 text-sm text-muted-foreground">{a.frameworks.join(", ")}, updated {day(a.updatedAt)}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild><Link to={assessHref}>{p.open > 0 ? "Continue the assessment" : "Review the answers"}</Link></Button>
            <Button asChild variant="outline"><Link to={`/assessment/${a.id}/dashboard`}>Open full results</Link></Button>
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

      <div>
        <RequirementMap posture={p} href={assessHref} />
        {p.answered > 0 && p.unverified > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {plural(p.unverified, "answer")} {p.unverified === 1 ? "rests" : "rest"} on evidence that has not been seen and verified.
          </p>
        )}
      </div>

      {p.topGaps.length > 0 && (
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 className="font-serif text-xl">Close these first</h3>
            <p className="text-sm text-muted-foreground">Ordered by priority, then risk</p>
          </div>
          <GapList gaps={p.topGaps} href={assessHref} />
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading your workspace">
      <div className="h-10 w-2/3 animate-pulse rounded-md bg-muted" />
      <div className="h-5 w-1/2 animate-pulse rounded-md bg-muted" />
      <div className="h-96 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { userRole, userRoleLabel, canManageUsers, loading: roleLoading } = usePermissions();
  const { data, error, loading, retry } = useOverview(user?.id, !roleLoading, canManageUsers);
  const [focusId, setFocusId] = useState<string | null>(null);

  const view = useMemo(() => {
    if (!data) return null;
    const facts: WorkspaceFacts = {
      assessments: data.assessments.map((a) => ({ id: a.id, name: a.name, status: a.status, mine: a.mine, criticalGaps: a.posture.criticalGaps, answered: a.posture.answered })),
      policies: data.policies, lastPolicy: data.lastPolicy, lastWorkspace: data.lastWorkspace, rights: data.rights, grievances: data.grievances,
    };
    const features = featureViews(userRole, facts);
    return {
      features,
      reached: stageReached(facts),
      waiting: features.reduce((n, f) => n + f.flags.length, 0),
      organisations: worstFirst(data.assessments),
      untouched: !data.assessments.length && !data.policies.total && !data.workspaces,
    };
  }, [data, userRole]);

  if (error) {
    return (
      <div className="max-w-xl space-y-4 py-8">
        <h1 className="font-serif text-3xl">Your workspace could not be loaded.</h1>
        <p className="text-muted-foreground">Your data is unchanged. Check your connection and load it again.</p>
        <Button onClick={retry}>Load again</Button>
      </div>
    );
  }
  if (loading || !view) return <Skeleton />;

  const { features, reached, waiting, organisations, untouched } = view;
  const focus = organisations.find((a) => a.id === focusId) ?? organisations[0];
  const first = profile?.full_name?.split(" ")[0];
  const context = [profile?.organisation, userRoleLabel].filter(Boolean).join(", ");
  const locked = features.filter((f) => f.locked).length;

  return (
    <div className="space-y-16">
      <header>
        {context && <p className="text-sm text-muted-foreground">{context}</p>}
        <h1 className="mt-3 max-w-[24ch] font-serif text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.12] tracking-tight [text-wrap:balance]">
          {untouched
            ? `${first ? `${first}, here` : "Here"} is everything you can do, stage by stage.`
            : waiting > 0
              ? `${plural(waiting, "thing")} ${waiting === 1 ? "needs" : "need"} your attention.`
              : "Nothing is waiting on you."}
        </h1>
        <p className="mt-4 max-w-[62ch] text-muted-foreground">
          {untouched
            ? "A privacy programme runs in six stages. Each one below lists its tools and what they are for. Start by reading what applies to you, or go straight to an assessment."
            : "Every tool is below, on the stage of the programme it belongs to. Anything overdue or waiting is marked on its tool."}
        </p>
        {untouched && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link to="/assessments">Start an assessment</Link></Button>
            <Button asChild variant="outline"><Link to="/learn">Browse the regulations</Link></Button>
          </div>
        )}
      </header>

      <Section title="Your programme" aside={locked > 0 && `${plural(locked, "tool")} need access you do not have yet`}>
        <StageBoard features={features} reached={reached} />
      </Section>

      <Section title="Administration and account">
        <FeatureList features={features.filter((f) => f.group === "admin")} />
      </Section>

      {focus && (
        <Section
          title={organisations.length > 1 ? "Organisations" : "Where you stand"}
          aside={organisations.length > 1 ? <>Weakest first. Choose one to see it below. <TextLink to="/assessments">Manage assessments</TextLink></> : undefined}
        >
          <div className="space-y-10">
            {organisations.length > 1 && <OrganisationTable rows={organisations} focusId={focus.id} onPick={setFocusId} />}
            <Posture a={focus} />
          </div>
        </Section>
      )}
    </div>
  );
}
