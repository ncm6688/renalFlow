import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Button, Card, CardBody, IconButton, Input, Label, PencilIcon, Pill, TrashIcon } from "../components/ui";
import { apiFetch } from "../lib/http";
import { useAuth } from "../store/auth";

type LabResult = {
  _id: string;
  date: string;
  urineTest?: { protein?: string; acr?: number };
  bloodTest?: { creatinine?: number; egfr?: number; potassium?: number };
  vitals?: {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    weight?: number;
  };
};

type MetricKey = "egfr" | "creatinine" | "urineACR" | "potassium" | "bpSystolic" | "weight";
const METRICS: Array<{ key: MetricKey; label: string; unitHint: string }> = [
  { key: "egfr", label: "eGFR", unitHint: "trend" },
  { key: "creatinine", label: "Creatinine", unitHint: "trend" },
  { key: "urineACR", label: "Urine ACR", unitHint: "trend" },
  { key: "bpSystolic", label: "Blood Pressure (Sys)", unitHint: "trend" },
  { key: "potassium", label: "Potassium", unitHint: "trend" },
  { key: "weight", label: "Weight", unitHint: "trend" },
];

function Sparkline({
  points,
}: {
  points: Array<{ xLabel: string; y: number }>;
}) {
  const w = 640;
  const h = 160;
  const padX = 18;
  const padY = 18;

  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-600">
        Add at least 2 records to see a trend line.
      </div>
    );
  }

  const ys = points.map((p) => p.y);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const ySpan = yMax - yMin || 1;

  const xStep = (w - padX * 2) / (points.length - 1);

  const toX = (i: number) => padX + i * xStep;
  const toY = (y: number) => {
    const t = (y - yMin) / ySpan; // 0..1
    return h - padY - t * (h - padY * 2);
  };

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(2)} ${toY(p.y).toFixed(2)}`)
    .join(" ");

  const dArea = `${d} L ${(w - padX).toFixed(2)} ${(h - padY).toFixed(2)} L ${padX.toFixed(
    2
  )} ${(h - padY).toFixed(2)} Z`;

  const last = points[points.length - 1]!;

  return (
    <div className="rounded-[28px] border border-slate-200/60 bg-white/65 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full">
        <defs>
          <linearGradient id="rf_fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7FAF92" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7FAF92" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="rf_stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6E9E83" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#7FAF92" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#A7C9B4" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* grid */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padX}
            x2={w - padX}
            y1={padY + t * (h - padY * 2)}
            y2={padY + t * (h - padY * 2)}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        ))}

        {/* area + line */}
        <path d={dArea} fill="url(#rf_fill)" />
        <path d={d} fill="none" stroke="url(#rf_stroke)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* dots */}
        {points.map((p, i) => (
          <circle key={p.xLabel + i} cx={toX(i)} cy={toY(p.y)} r="4.2" fill="#7FAF92" stroke="#ffffff" strokeWidth="2" />
        ))}
      </svg>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
        <div>
          <span className="font-semibold text-slate-900">{last.y}</span> · {last.xLabel}
        </div>
        <div>
          min <span className="font-semibold text-slate-900">{yMin}</span> · max{" "}
          <span className="font-semibold text-slate-900">{yMax}</span>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const token = useAuth((s) => s.accessToken) || "";
  const me = useAuth((s) => s.user);
  const isAdmin = me?.role === "admin";

  if (isAdmin) {
    return <Navigate to="/forum" replace />;
  }

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<LabResult[]>([]);
  const [metric, setMetric] = useState<MetricKey>("egfr");

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [egfr, setEgfr] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [urineProtein, setUrineProtein] = useState("");
  const [urineACR, setUrineACR] = useState("");
  const [bpSys, setBpSys] = useState("");
  const [bpDia, setBpDia] = useState("");
  const [potassium, setPotassium] = useState("");
  const [weight, setWeight] = useState("");

  const [editing, setEditing] = useState<LabResult | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editEgfr, setEditEgfr] = useState("");
  const [editCreatinine, setEditCreatinine] = useState("");
  const [editUrineProtein, setEditUrineProtein] = useState("");
  const [editUrineACR, setEditUrineACR] = useState("");
  const [editBpSys, setEditBpSys] = useState("");
  const [editBpDia, setEditBpDia] = useState("");
  const [editPotassium, setEditPotassium] = useState("");
  const [editWeight, setEditWeight] = useState("");

  const openEdit = (r: LabResult) => {
    setEditing(r);
    setEditDate(new Date(r.date).toISOString().slice(0, 10));
    setEditEgfr(r.bloodTest?.egfr?.toString?.() ?? "");
    setEditCreatinine(r.bloodTest?.creatinine?.toString?.() ?? "");
    setEditUrineProtein(r.urineTest?.protein ?? "");
    setEditUrineACR(r.urineTest?.acr?.toString?.() ?? "");
    setEditBpSys(r.vitals?.bloodPressureSystolic?.toString?.() ?? "");
    setEditBpDia(r.vitals?.bloodPressureDiastolic?.toString?.() ?? "");
    setEditPotassium(r.bloodTest?.potassium?.toString?.() ?? "");
    setEditWeight(r.vitals?.weight?.toString?.() ?? "");
  };

  const closeEdit = () => setEditing(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const res = await apiFetch<{ labResults: LabResult[] }>("/api/lab-results?limit=50", {
        method: "GET",
        token,
      });
      setResults(res.labResults || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load results");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSave = useMemo(() => {
    return (
      egfr.trim() ||
      creatinine.trim() ||
      urineProtein.trim() ||
      urineACR.trim() ||
      bpSys.trim() ||
      bpDia.trim() ||
      potassium.trim() ||
      weight.trim()
    );
  }, [egfr, creatinine, urineProtein, urineACR, bpSys, bpDia, potassium, weight]);

  const getMetricValue = (r: LabResult, key: MetricKey): number | undefined => {
    switch (key) {
      case "egfr":
        return r.bloodTest?.egfr;
      case "creatinine":
        return r.bloodTest?.creatinine;
      case "potassium":
        return r.bloodTest?.potassium;
      case "urineACR":
        return r.urineTest?.acr;
      case "bpSystolic":
        return r.vitals?.bloodPressureSystolic;
      case "weight":
        return r.vitals?.weight;
      default:
        return undefined;
    }
  };

  const series = useMemo(() => {
    // results are currently newest-first; for chart, use oldest-first
    const sorted = [...results].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const pts: Array<{ xLabel: string; y: number }> = [];
    for (const r of sorted) {
      const v = getMetricValue(r, metric);
      if (typeof v === "number" && Number.isFinite(v)) {
        pts.push({ xLabel: new Date(r.date).toISOString().slice(0, 10), y: Number(v.toFixed(2)) });
      }
    }
    return pts;
  }, [results, metric]);

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-lg">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold tracking-tight text-slate-900">Edit record</div>
                  <Button variant="ghost" onClick={closeEdit}>
                    Close
                  </Button>
                </div>

                <form
                  className="mt-4 space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    setErr(null);
                    try {
                      await apiFetch(`/api/lab-results/${editing._id}`, {
                        method: "PUT",
                        token,
                        body: JSON.stringify({
                          date: editDate,
                          egfr: editEgfr === "" ? "" : Number(editEgfr),
                          creatinine: editCreatinine === "" ? "" : Number(editCreatinine),
                          urineProtein: editUrineProtein,
                          urineACR: editUrineACR === "" ? "" : Number(editUrineACR),
                          bloodPressureSystolic: editBpSys === "" ? "" : Number(editBpSys),
                          bloodPressureDiastolic: editBpDia === "" ? "" : Number(editBpDia),
                          potassium: editPotassium === "" ? "" : Number(editPotassium),
                          weight: editWeight === "" ? "" : Number(editWeight),
                        }),
                      });
                      closeEdit();
                      await refresh();
                    } catch (e2) {
                      setErr(e2 instanceof Error ? e2.message : "Update failed");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>eGFR</Label>
                      <Input value={editEgfr} onChange={(e) => setEditEgfr(e.target.value)} inputMode="decimal" />
                    </div>
                    <div>
                      <Label>Creatinine</Label>
                      <Input value={editCreatinine} onChange={(e) => setEditCreatinine(e.target.value)} inputMode="decimal" />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Urine protein</Label>
                      <Input value={editUrineProtein} onChange={(e) => setEditUrineProtein(e.target.value)} />
                    </div>
                    <div>
                      <Label>Urine ACR</Label>
                      <Input value={editUrineACR} onChange={(e) => setEditUrineACR(e.target.value)} inputMode="decimal" />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>BP systolic</Label>
                      <Input value={editBpSys} onChange={(e) => setEditBpSys(e.target.value)} inputMode="numeric" />
                    </div>
                    <div>
                      <Label>BP diastolic</Label>
                      <Input value={editBpDia} onChange={(e) => setEditBpDia(e.target.value)} inputMode="numeric" />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Potassium</Label>
                      <Input value={editPotassium} onChange={(e) => setEditPotassium(e.target.value)} inputMode="decimal" />
                    </div>
                    <div>
                      <Label>Weight</Label>
                      <Input value={editWeight} onChange={(e) => setEditWeight(e.target.value)} inputMode="decimal" />
                    </div>
                  </div>

                  {err ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</div>
                  ) : null}

                  <div className="flex gap-2 pt-1">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Saving..." : "Save changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1"
                      disabled={loading}
                      onClick={async () => {
                        if (!confirm("Delete this record?")) return;
                        setLoading(true);
                        setErr(null);
                        try {
                          await apiFetch(`/api/lab-results/${editing._id}`, { method: "DELETE", token });
                          closeEdit();
                          await refresh();
                        } catch (e2) {
                          setErr(e2 instanceof Error ? e2.message : "Delete failed");
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}

      <div className="lg:col-span-2">
        <Card>
          <CardBody>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold tracking-tight text-slate-900">Health tracking</div>
                <div className="mt-1 text-sm font-medium text-slate-600">Add lab metrics</div>
              </div>
              <Pill>Private</Pill>
            </div>

            <form
              className="mt-5 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!canSave) return;
                setLoading(true);
                setErr(null);
                try {
                  await apiFetch("/api/lab-results", {
                    method: "POST",
                    token,
                    body: JSON.stringify({
                      date,
                      egfr: egfr ? Number(egfr) : undefined,
                      creatinine: creatinine ? Number(creatinine) : undefined,
                      urineProtein: urineProtein || undefined,
                      urineACR: urineACR ? Number(urineACR) : undefined,
                      bloodPressureSystolic: bpSys ? Number(bpSys) : undefined,
                      bloodPressureDiastolic: bpDia ? Number(bpDia) : undefined,
                      potassium: potassium ? Number(potassium) : undefined,
                      weight: weight ? Number(weight) : undefined,
                    }),
                  });
                  setEgfr("");
                  setCreatinine("");
                  setUrineProtein("");
                  setUrineACR("");
                  setBpSys("");
                  setBpDia("");
                  setPotassium("");
                  setWeight("");
                  await refresh();
                } catch (e2) {
                  setErr(e2 instanceof Error ? e2.message : "Save failed");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>eGFR</Label>
                  <Input value={egfr} onChange={(e) => setEgfr(e.target.value)} inputMode="decimal" placeholder="e.g. 72" />
                </div>
                <div>
                  <Label>Creatinine</Label>
                  <Input value={creatinine} onChange={(e) => setCreatinine(e.target.value)} inputMode="decimal" placeholder="e.g. 88" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Urine protein</Label>
                  <Input value={urineProtein} onChange={(e) => setUrineProtein(e.target.value)} placeholder="e.g. negative / trace / 1+" />
                </div>
                <div>
                  <Label>Urine ACR</Label>
                  <Input value={urineACR} onChange={(e) => setUrineACR(e.target.value)} inputMode="decimal" placeholder="e.g. 30" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Blood Pressure</Label>
                  <Input value={bpSys} onChange={(e) => setBpSys(e.target.value)} inputMode="numeric" placeholder="Systolic (e.g. 120)" />
                </div>
                <div>
                  <Label>&nbsp;</Label>
                  <Input value={bpDia} onChange={(e) => setBpDia(e.target.value)} inputMode="numeric" placeholder="Diastolic (e.g. 80)" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Potassium</Label>
                  <Input value={potassium} onChange={(e) => setPotassium(e.target.value)} inputMode="decimal" placeholder="e.g. 4.2" />
                </div>
                <div>
                  <Label>Weight</Label>
                  <Input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" placeholder="Weight (e.g. 68.5)" />
                </div>
              </div>

              {err ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</div>
              ) : null}

              <Button type="submit" disabled={!canSave || loading} className="w-full">
                {loading ? "Saving..." : "Save"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card>
          <CardBody>
            <div className="text-lg font-semibold tracking-tight text-slate-900">Trends</div>
            <div className="mt-3 -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch]">
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  className={[
                    "shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition",
                    metric === m.key ? "bg-[#7FAF92] text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <Sparkline points={series} />
              <div className="mt-2 text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-700">{METRICS.find((m) => m.key === metric)?.label}</span>{" "}
                ({METRICS.find((m) => m.key === metric)?.unitHint}). Empty values are skipped.
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold tracking-tight text-slate-900">History</div>
              </div>
              <Button variant="ghost" onClick={refresh} disabled={loading}>
                Refresh
              </Button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden grid-cols-[1.4fr_1fr_1fr_1.5fr_1fr_1.3fr_1fr_1.2fr_1fr] bg-slate-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
                {["Date", "eGFR", "Cr", "Protein", "ACR", "BP", "K", "Weight", ""].map((h, i) => (
                  <div
                    key={h + i}
                    className={[
                      "flex items-center justify-center whitespace-nowrap",
                      i === 0 ? "" : "border-l border-slate-200/70",
                    ].join(" ")}
                    title={h === "Protein" ? "Urine protein" : undefined}
                  >
                    {h}
                  </div>
                ))}
              </div>
              {results.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-slate-600">No data yet. Add your first entry.</div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {results.map((r) => (
                    <div key={r._id} className="px-3 py-3 text-sm">
                      {/* mobile-friendly stacked */}
                      <div className="flex items-center justify-between md:hidden">
                        <div className="font-medium text-slate-900">{new Date(r.date).toISOString().slice(0, 10)}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-slate-500">
                            BP {r.vitals?.bloodPressureSystolic ?? "—"}/{r.vitals?.bloodPressureDiastolic ?? "—"}
                          </div>
                          <IconButton aria-label="Edit record" onClick={() => openEdit(r)}>
                            <PencilIcon />
                          </IconButton>
                          <IconButton
                            aria-label="Delete record"
                            tone="danger"
                            onClick={async () => {
                              if (!confirm("Delete this record?")) return;
                              setLoading(true);
                              setErr(null);
                              try {
                                await apiFetch(`/api/lab-results/${r._id}`, { method: "DELETE", token });
                                await refresh();
                              } catch (e2) {
                                setErr(e2 instanceof Error ? e2.message : "Delete failed");
                              } finally {
                                setLoading(false);
                              }
                            }}
                          >
                            <TrashIcon />
                          </IconButton>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-700 md:hidden">
                        <div>
                          eGFR: <span className="font-semibold text-slate-900">{r.bloodTest?.egfr ?? "—"}</span>
                        </div>
                        <div>
                          Cr: <span className="font-semibold text-slate-900">{r.bloodTest?.creatinine ?? "—"}</span>
                        </div>
                        <div>
                          ACR: <span className="font-semibold text-slate-900">{r.urineTest?.acr ?? "—"}</span>
                        </div>
                        <div>
                          K: <span className="font-semibold text-slate-900">{r.bloodTest?.potassium ?? "—"}</span>
                        </div>
                        <div>
                          Weight: <span className="font-semibold text-slate-900">{r.vitals?.weight ?? "—"}</span>
                        </div>
                        <div className="col-span-2">
                          Urine protein: <span className="font-semibold text-slate-900">{r.urineTest?.protein ?? "—"}</span>
                        </div>
                      </div>

                      {/* desktop row */}
                      <div className="hidden grid-cols-[1.4fr_1fr_1fr_1.5fr_1fr_1.3fr_1fr_1.2fr_1fr] px-1 md:grid">
                        <div
                          className="flex items-center justify-center whitespace-nowrap font-medium text-slate-900 tabular-nums"
                          title={new Date(r.date).toISOString().slice(0, 10)}
                        >
                          {new Date(r.date).toISOString().slice(0, 10)}
                        </div>
                        <div className="flex items-center justify-center border-l border-slate-200/60 text-slate-700 tabular-nums">
                          {r.bloodTest?.egfr ?? "—"}
                        </div>
                        <div className="flex items-center justify-center border-l border-slate-200/60 text-slate-700 tabular-nums">
                          {r.bloodTest?.creatinine ?? "—"}
                        </div>
                        <div
                          className="flex items-center justify-center border-l border-slate-200/60 px-2 text-slate-700"
                          title={r.urineTest?.protein ?? ""}
                        >
                          <span className="w-full truncate text-center">{r.urineTest?.protein ?? "—"}</span>
                        </div>
                        <div className="flex items-center justify-center border-l border-slate-200/60 text-slate-700 tabular-nums">
                          {r.urineTest?.acr ?? "—"}
                        </div>
                        <div className="flex items-center justify-center border-l border-slate-200/60 text-slate-700 tabular-nums">
                          {r.vitals?.bloodPressureSystolic ?? "—"}/{r.vitals?.bloodPressureDiastolic ?? "—"}
                        </div>
                        <div className="flex items-center justify-center border-l border-slate-200/60 text-slate-700 tabular-nums">
                          {r.bloodTest?.potassium ?? "—"}
                        </div>
                        <div className="flex items-center justify-center border-l border-slate-200/60 text-slate-700 tabular-nums">
                          {r.vitals?.weight ?? "—"}
                        </div>
                        <div className="flex items-center justify-center gap-1 border-l border-slate-200/60">
                          <IconButton aria-label="Edit record" onClick={() => openEdit(r)}>
                            <PencilIcon />
                          </IconButton>
                          <IconButton
                            aria-label="Delete record"
                            tone="danger"
                            onClick={async () => {
                              if (!confirm("Delete this record?")) return;
                              setLoading(true);
                              setErr(null);
                              try {
                                await apiFetch(`/api/lab-results/${r._id}`, { method: "DELETE", token });
                                await refresh();
                              } catch (e2) {
                                setErr(e2 instanceof Error ? e2.message : "Delete failed");
                              } finally {
                                setLoading(false);
                              }
                            }}
                          >
                            <TrashIcon />
                          </IconButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

