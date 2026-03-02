import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  BookOpen,
  Shield,
  Users,
  Coins,
  FlaskConical,
  ArrowRight,
  Clock,
  Hash,
  Activity,
  Zap,
  Navigation,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  loadFounderState,
  founderSteps,
  isFinal,
  getStepIndex,
  type FounderState,
} from "../fsm/founderJourney";

interface LedgerEntry {
  id: string;
  documentId: string;
  hash: string;
  eventType: string;
  timestamp: string;
}

type OpState = "IDLE" | "BUILDING" | "THROTTLED" | "ESCALATED";

function transition(state: OpState, event: string): OpState {
  switch (state) {
    case "IDLE":
      if (event === "START_BUILD") return "BUILDING";
      break;
    case "BUILDING":
      if (event === "THROTTLE") return "THROTTLED";
      if (event === "OVERDRIVE") return "ESCALATED";
      break;
    case "THROTTLED":
      if (event === "RESET") return "IDLE";
      break;
    case "ESCALATED":
      if (event === "RESET") return "IDLE";
      break;
  }
  return state;
}

function runRegime(velocity: number): "SAFE" | "OVERDRIVE" {
  return velocity > 75 ? "OVERDRIVE" : "SAFE";
}

async function hashTransition(from: OpState, to: OpState, event: string): Promise<string> {
  const text = `${from}->${to}:${event}:${Date.now()}`;
  const res = await fetch("/api/documents/hash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data: { sha256?: unknown } = await res.json();
  const rawSha256 = data.sha256;
  const sha256 = typeof rawSha256 === "string" && rawSha256.trim().length > 0 ? rawSha256.trim() : null;

  if (!sha256) {
    throw new Error(
      `hashTransition: invalid sha256 returned from /api/documents/hash (event=${event})`
    );
  }

  return sha256;
}

async function notarizeTransition(hash: string, eventType: string): Promise<void> {
  await fetch("/api/ledger/notarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId: "founder-machine", hash, eventType }),
  });
}

const opStateColors: Record<OpState, string> = {
  IDLE: "bg-muted/50 text-muted-foreground border-border",
  BUILDING: "bg-primary/10 text-primary border-primary/30",
  THROTTLED: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  ESCALATED: "bg-red-500/10 text-red-400 border-red-500/30",
};

const journeyStateColors: Record<FounderState, string> = {
  CRISIS: "bg-red-500/10 text-red-400 border-red-500/30",
  LAB_ACTIVATION: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  RECEIPTS: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  STAGECRED: "bg-primary/10 text-primary border-primary/30",
  CAPITAL: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

const systemLinks = [
  { href: "/governance", label: "Governance", description: "Somatic throttle & provenance notary", icon: Shield, color: "text-primary" },
  { href: "/contracts", label: "Contracts", description: "Agreement library & IP protection", icon: FileText, color: "text-primary" },
  { href: "/faculty-onboarding", label: "Faculty", description: "Founding Faculty onboarding", icon: Users, color: "text-primary" },
  { href: "/token-economy", label: "Token Economy", description: "StageCred infrastructure & pricing", icon: Coins, color: "text-primary" },
  { href: "/research", label: "R&D", description: "Signal layer research division", icon: FlaskConical, color: "text-primary" },
  { href: "/startup-studios", label: "StudiOS", description: "Conservatory OS for founders", icon: Navigation, color: "text-primary" },
];

export default function FounderDashboard() {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery<any[]>({ queryKey: ["/api/documents"] });
  const ledgerQuery = useQuery<LedgerEntry[]>({ queryKey: ["/api/ledger"] });
  const journeyLedgerQuery = useQuery<LedgerEntry[]>({
    queryKey: ["/api/ledger/founder_journey"],
  });

  const [journeyState] = useState<FounderState>(loadFounderState);
  const [opState, setOpState] = useState<OpState>("IDLE");
  const [velocity, setVelocity] = useState(50);
  const [isNotarizing, setIsNotarizing] = useState(false);

  const docCount = documentsQuery.data?.length ?? 0;
  const ledgerCount = ledgerQuery.data?.length ?? 0;
  const recentLedger = (ledgerQuery.data ?? []).slice(-5).reverse();
  const isLoading = documentsQuery.isLoading || ledgerQuery.isLoading;

  const journeyLedgerCount = journeyLedgerQuery.data?.length ?? 0;
  const totalSteps = founderSteps.length;
  const journeyStepIdx = getStepIndex(journeyState);
  const completedSteps = Math.min(journeyStepIdx, totalSteps);
  const regime = runRegime(velocity);

  const fireTransition = useCallback(
    async (event: string) => {
      const next = transition(opState, event);
      if (next === opState) return;
      setIsNotarizing(true);
      try {
        const hash = await hashTransition(opState, next, event);
        await notarizeTransition(hash, event);
        setOpState(next);
        queryClient.invalidateQueries({ queryKey: ["/api/ledger"] });
        queryClient.invalidateQueries({ queryKey: ["/api/ledger/founder_journey"] });
      } finally {
        setIsNotarizing(false);
      }
    },
    [opState, queryClient]
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="link-back-home">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs tracking-[0.15em] font-light">STAGEPORT SYSTEMS</span>
              </Button>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/governance" className="text-xs tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors font-light" data-testid="link-governance">
                GOVERNANCE
              </Link>
              <Link href="/contracts" className="text-xs tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors font-light" data-testid="link-contracts">
                CONTRACTS
              </Link>
              <Link href="/faculty-onboarding" className="text-xs tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors font-light" data-testid="link-faculty">
                FACULTY
              </Link>
              <Link href="/token-economy" className="text-xs tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors font-light" data-testid="link-tokens">
                TOKENS
              </Link>
              <Link href="/startup-studios" className="text-xs tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors font-light" data-testid="link-studioos">
                STUDIOOS
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <div className="mb-12">
            <span className="text-xs tracking-[0.2em] text-primary font-medium" data-testid="text-founder-label">
              FOUNDER DASHBOARD
            </span>
            <h1 className="text-4xl md:text-5xl font-light mt-4 mb-4" data-testid="text-founder-headline">
              Command Center
            </h1>
            <p className="text-muted-foreground font-light max-w-2xl" data-testid="text-founder-description">
              System-wide overview. Monitor governance activity, navigate infrastructure, and track ledger provenance from a single view.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
              {[1, 2, 3].map((i) => (
                <Card key={i} data-testid={`card-skeleton-${i}`}>
                  <CardContent className="p-6">
                    <div className="h-20 animate-pulse bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
              <Card data-testid="card-document-count">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs tracking-[0.15em] text-muted-foreground font-light uppercase">Documents</p>
                      <p className="text-3xl font-bold text-primary" data-testid="text-doc-count">{docCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-ledger-count">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs tracking-[0.15em] text-muted-foreground font-light uppercase">Ledger Entries</p>
                      <p className="text-3xl font-bold text-primary" data-testid="text-ledger-count">{ledgerCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-system-status">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-emerald-500/10">
                      <Activity className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs tracking-[0.15em] text-muted-foreground font-light uppercase">System Status</p>
                      <p className="text-lg font-medium text-emerald-400" data-testid="text-system-status">Operational</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mb-12">
            <h2 className="text-sm tracking-[0.15em] text-muted-foreground font-light uppercase mb-6" data-testid="text-quick-access-label">
              Quick Access
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Card className="hover:border-primary/30 transition-all duration-200 cursor-pointer h-full" data-testid={`card-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <link.icon className={`w-5 h-5 ${link.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-medium text-sm">{link.label}</h3>
                          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground font-light mt-1">{link.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <Card data-testid="card-founder-journey">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium tracking-[0.1em] uppercase text-muted-foreground flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  Founder Journey
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-xs ${journeyStateColors[journeyState]}`}
                    data-testid="badge-journey-state"
                  >
                    {journeyState}
                  </Badge>
                  {isFinal(journeyState) && (
                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      COMPLETE
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium" data-testid="text-journey-step">
                    {founderSteps[getStepIndex(journeyState)]?.label ?? "Complete"}
                  </p>
                  <p className="text-xs text-muted-foreground font-light mt-1">
                    {completedSteps} of {totalSteps} steps notarized · {journeyLedgerCount} ledger events
                  </p>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${totalSteps === 0 ? 0 : (completedSteps / totalSteps) * 100}%` }}
                    data-testid="progress-journey"
                  />
                </div>
                <Link href="/founder/onboarding">
                  <Button variant="outline" size="sm" className="gap-2 w-full" data-testid="button-continue-journey">
                    {isFinal(journeyState) ? "View Complete Journey" : "Continue Journey"}
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card data-testid="card-op-state">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium tracking-[0.1em] uppercase text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Founder Machine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-xs ${opStateColors[opState]}`}
                    data-testid="badge-op-state"
                  >
                    {opState}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${regime === "OVERDRIVE" ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}`}
                    data-testid="badge-regime"
                  >
                    {regime}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-light">Velocity</p>
                    <span className="text-xs font-mono text-primary">{velocity}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={velocity}
                    onChange={(e) => setVelocity(Number(e.target.value))}
                    className="w-full accent-primary"
                    data-testid="slider-velocity"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isNotarizing || opState !== "IDLE"}
                    onClick={() => fireTransition("START_BUILD")}
                    className="text-xs"
                    data-testid="button-start-build"
                  >
                    Start Build
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isNotarizing || opState !== "BUILDING"}
                    onClick={() => fireTransition("THROTTLE")}
                    className="text-xs"
                    data-testid="button-throttle"
                  >
                    Throttle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isNotarizing || opState !== "BUILDING"}
                    onClick={() => fireTransition("OVERDRIVE")}
                    className="text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                    data-testid="button-overdrive"
                  >
                    Overdrive
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isNotarizing || (opState !== "THROTTLED" && opState !== "ESCALATED")}
                    onClick={() => fireTransition("RESET")}
                    className="text-xs"
                    data-testid="button-reset"
                  >
                    Reset
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/50 font-light">
                  Each transition writes a notarized ledger entry.
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm tracking-[0.15em] text-muted-foreground font-light uppercase" data-testid="text-recent-activity-label">
                Recent Ledger Activity
              </h2>
              <Link href="/governance">
                <Button variant="ghost" size="sm" className="gap-2 text-xs" data-testid="button-view-all-ledger">
                  View Governance
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            {recentLedger.length === 0 ? (
              <Card data-testid="card-no-activity">
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-light">
                    No ledger entries yet. Use the Governance dashboard to notarize your first document.
                  </p>
                  <Link href="/governance">
                    <Button variant="outline" size="sm" className="mt-4 gap-2" data-testid="button-goto-governance-empty">
                      Open Governance
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentLedger.map((entry, idx) => (
                  <Card key={entry.id} data-testid={`card-ledger-entry-${idx}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        <Hash className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{entry.documentId}</span>
                          <Badge variant="outline" className="text-[10px]">{entry.eventType ?? "NOTARIZED"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate mt-1">{entry.hash}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
