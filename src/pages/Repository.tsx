import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FolderOpen, Search, Download, Paperclip, Eye, FileText, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { REPOSITORY_FOLDERS, getAllArtefacts, getFolderArtefactCount, type Artefact, type RepositoryFolder } from "@/data/repositoryData";

const STATUS_COLORS: Record<string, string> = {
  Missing: "bg-destructive/15 text-destructive border-destructive/30",
  Draft: "bg-amber/15 text-amber border-amber/30",
  "Under Review": "bg-risk-standard/15 text-risk-standard border-risk-standard/30",
  Approved: "bg-emerald/15 text-emerald border-emerald/30",
};

function StatusBadgeRepo({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[status] || ""}`}>
      {status}
    </span>
  );
}

function ArtefactTable({ artefacts, search, statusFilter }: { artefacts: Artefact[]; search: string; statusFilter: string }) {
  const filtered = artefacts.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  if (filtered.length === 0) return <p className="text-sm text-muted-foreground py-3 pl-2">No matching artefacts.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="w-10">#</TableHead>
          <TableHead>Artefact Name</TableHead>
          <TableHead className="w-32">Status</TableHead>
          <TableHead className="w-36">Owner</TableHead>
          <TableHead className="w-32">Last Updated</TableHead>
          <TableHead className="w-28 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((a, i) => (
          <TableRow key={i} className="border-border even:bg-secondary/30">
            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
            <TableCell className="font-medium">{a.name}</TableCell>
            <TableCell><StatusBadgeRepo status={a.status} /></TableCell>
            <TableCell className="text-muted-foreground text-sm">{a.owner}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{a.lastUpdated}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7"><Paperclip className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function Repository() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");

  const allArtefacts = useMemo(() => getAllArtefacts(REPOSITORY_FOLDERS), []);

  const visibleFolders = useMemo(() => {
    if (phaseFilter === "all") return REPOSITORY_FOLDERS;
    return REPOSITORY_FOLDERS.filter((f) => String(f.phase) === phaseFilter);
  }, [phaseFilter]);

  const counts = useMemo(() => {
    const total = allArtefacts.length;
    const approved = allArtefacts.filter((a) => a.status === "Approved").length;
    const pending = allArtefacts.filter((a) => a.status === "Draft" || a.status === "Under Review").length;
    const missing = allArtefacts.filter((a) => a.status === "Missing").length;
    return { total, approved, pending, missing };
  }, [allArtefacts]);

  const stats = [
    { label: "Total Artefacts", value: counts.total, icon: FileText },
    { label: "Approved", value: counts.approved, icon: CheckCircle2 },
    { label: "Pending Review", value: counts.pending, icon: Clock },
    { label: "Missing", value: counts.missing, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Evidence Repository</h1>
          <p className="text-muted-foreground">Centralised artefact store for all DPDP Act assessment phases</p>
        </div>
        <Button variant="outline" className="shrink-0">
          <Download className="h-4 w-4 mr-2" /> Export Index
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search artefacts…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Missing">Missing</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Under Review">Under Review</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Phase" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            {REPOSITORY_FOLDERS.map((f) => (
              <SelectItem key={f.phase} value={String(f.phase)}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Accordion Folders */}
      <Accordion type="multiple" className="space-y-3">
        {visibleFolders.map((folder) => (
          <AccordionItem key={folder.phase} value={`phase-${folder.phase}`} className="border border-border rounded-lg overflow-hidden bg-card">
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-secondary/40">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-5 w-5 text-amber shrink-0" />
                <span className="font-semibold">Phase {folder.phase} – {folder.name}</span>
                <Badge className="bg-primary/20 text-primary border-primary/30 ml-1">
                  {getFolderArtefactCount(folder)}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {folder.artefacts && (
                <ArtefactTable artefacts={folder.artefacts} search={search} statusFilter={statusFilter} />
              )}
              {folder.subFolders && folder.subFolders.map((sf) => (
                <div key={sf.label} className="mt-4 first:mt-0">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2 pl-2">{sf.label}</h4>
                  <ArtefactTable artefacts={sf.artefacts} search={search} statusFilter={statusFilter} />
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
