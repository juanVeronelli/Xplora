/**
 * Database → Listas de contactos: filtros como «Ver miembros», guardado con snapshot completo por usuario.
 */
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type {
  AdminMemberRow,
  ContactListMemberSnapshotV1,
  ContactListSummary,
  ContactListFilterSnapshot,
} from "../../types";
import { authFetch, readApiError } from "../../lib/serverApi";
import {
  applyMemberFilters,
  buildFilterSnapshot,
  normalizePctBounds,
  parseOptionalPct,
} from "../../lib/memberListFilters";
import {
  Field,
  Sel,
  TwoCol,
  Spinner,
  Empty,
} from "./crm/CrmUi";
import { crm } from "./crm/crmTheme";
import { useToast, useConfirm } from "../../context/FeedbackContext";

type InnerTab = "create" | "manage";

const INNER_TABS: { id: InnerTab; label: string; title: string }[] = [
  {
    id: "create",
    label: "Crear lista",
    title: "Filtrar miembros y guardar con todos los datos",
  },
  {
    id: "manage",
    label: "Administrar listas",
    title: "Ver contactos, exportar CSV, editar nombre o borrar",
  },
];

type DetailSnapshotRow = {
  id: string;
  usuario_id: string | null;
  snapshot: ContactListMemberSnapshotV1;
};

function isSnapshotV1(raw: unknown): raw is ContactListMemberSnapshotV1 {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return Boolean(
    o.v === 1 &&
      typeof o.captured_at === "string" &&
      o.row !== null &&
      typeof o.row === "object",
  );
}

function csvEscapeCell(v: string): string {
  if (/[",\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function exportSnapshotsCsv(
  members: { snapshot: unknown }[],
  listNombre: string,
): void {
  const headers = [
    "id",
    "nombre",
    "email",
    "carrera",
    "es_alumno_cema",
    "created_at_usuario",
    "updated_at_usuario",
    "usuario_eventos_anotado",
    "usuario_eventos_asistio",
    "eventos_inscripto",
    "eventos_asistio_calc",
    "pct_asistencia",
    "inscripciones_json",
    "snapshot_captured_at",
  ];

  const lines: string[] = [headers.join(",")];
  for (const m of members) {
    if (!isSnapshotV1(m.snapshot)) continue;
    const r = m.snapshot.row;
    const insJson = JSON.stringify(r.inscripciones ?? []);
    const vals = [
      r.id,
      r.nombre ?? "",
      r.email ?? "",
      r.carrera ?? "",
      String(r.es_alumno_cema ?? ""),
      r.created_at ?? "",
      r.updated_at ?? "",
      String(r.usuario_eventos_anotado ?? ""),
      String(r.usuario_eventos_asistio ?? ""),
      String(r.eventos_inscripto ?? ""),
      String(r.eventos_asistio ?? ""),
      r.pct_asistencia == null ? "" : String(r.pct_asistencia),
      insJson,
      m.snapshot.captured_at,
    ];
    lines.push(vals.map((x) => csvEscapeCell(String(x))).join(","));
  }
  if (lines.length <= 1) return;

  const blob = new Blob(["\ufeff" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = listNombre.replace(/[^\w\s\-áéíóúñÁÉÍÓÚÑ]/gi, "_").slice(0, 80);
  a.href = url;
  a.download = `lista_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ContactListsPanel() {
  const toast = useToast();
  const confirm = useConfirm();

  const [membersLoading, setMembersLoading] = useState(true);
  const [allMembers, setAllMembers] = useState<AdminMemberRow[]>([]);

  const [listsLoading, setListsLoading] = useState(true);
  const [lists, setLists] = useState<ContactListSummary[]>([]);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [emailQuery, setEmailQuery] = useState("");
  const [carreraFilter, setCarreraFilter] = useState("");
  const [pctMin, setPctMin] = useState("");
  const [pctMax, setPctMax] = useState("");
  const [esAlumnoCema, setEsAlumnoCema] = useState<"" | "yes" | "no">("");
  const [saving, setSaving] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailMembers, setDetailMembers] = useState<DetailSnapshotRow[]>([]);
  const [detailTitle, setDetailTitle] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingDesc, setEditingDesc] = useState("");
  const [patching, setPatching] = useState(false);

  const [innerTab, setInnerTab] = useState<InnerTab>("create");

  const filterSnap: ContactListFilterSnapshot = useMemo(
    () =>
      buildFilterSnapshot(emailQuery, carreraFilter, pctMin, pctMax, esAlumnoCema),
    [emailQuery, carreraFilter, pctMin, pctMax, esAlumnoCema],
  );

  const filtered = useMemo(
    () => applyMemberFilters(allMembers, filterSnap),
    [allMembers, filterSnap],
  );

  const carreraOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of allMembers) {
      const c = (r.carrera || "").trim();
      if (c) set.add(c);
    }
    const sorted = [...set].sort((a, b) => a.localeCompare(b, "es"));
    return [
      { value: "", label: "Todas las carreras" },
      { value: "__NONE__", label: "(Sin carrera)" },
      ...sorted.map((c) => ({ value: c, label: c })),
    ];
  }, [allMembers]);

  const filtersActive =
    emailQuery.trim().length > 0 ||
    carreraFilter.length > 0 ||
    pctMin.trim().length > 0 ||
    pctMax.trim().length > 0 ||
    esAlumnoCema !== "";

  const clearFilters = () => {
    setEmailQuery("");
    setCarreraFilter("");
    setPctMin("");
    setPctMax("");
    setEsAlumnoCema("");
  };

  const pctBounds = useMemo(() => normalizePctBounds(pctMin, pctMax), [pctMin, pctMax]);
  const pctInvalid =
    pctMin.trim() !== "" &&
    pctMax.trim() !== "" &&
    parseOptionalPct(pctMin) != null &&
    parseOptionalPct(pctMax) != null &&
    parseOptionalPct(pctMin)! > parseOptionalPct(pctMax)!;

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    const res = await authFetch("/api/admin/members");
    if (!res.ok) {
      toast.error(await readApiError(res));
      setAllMembers([]);
      setMembersLoading(false);
      return;
    }
    const data = (await res.json()) as AdminMemberRow[];
    setAllMembers(data);
    setMembersLoading(false);
  }, [toast]);

  const loadLists = useCallback(async () => {
    setListsLoading(true);
    const res = await authFetch("/api/admin/contact-lists");
    if (!res.ok) {
      toast.error(await readApiError(res));
      setLists([]);
      setListsLoading(false);
      return;
    }
    const data = (await res.json()) as { lists: ContactListSummary[] };
    setLists(data.lists ?? []);
    setListsLoading(false);
  }, [toast]);

  useEffect(() => {
    void loadMembers();
    void loadLists();
  }, [loadMembers, loadLists]);

  const openDetail = async (id: string, title: string) => {
    setInnerTab("manage");
    setSelectedId(id);
    setDetailTitle(title);
    setEditingName(title);
    const meta = lists.find((l) => l.id === id);
    setEditingDesc(meta?.descripcion ?? "");
    setDetailLoading(true);
    setDetailMembers([]);
    const res = await authFetch(`/api/admin/contact-lists/${id}`);
    if (!res.ok) {
      toast.error(await readApiError(res));
      setDetailLoading(false);
      return;
    }
    const data = (await res.json()) as { members: { id: string; usuario_id: string | null; snapshot: unknown }[] };
    setDetailMembers(
      (data.members ?? [])
        .filter((m) => isSnapshotV1(m.snapshot))
        .map((m) => ({
          id: m.id,
          usuario_id: m.usuario_id,
          snapshot: m.snapshot as ContactListMemberSnapshotV1,
        })),
    );
    setDetailLoading(false);
  };

  const saveNewList = async () => {
    const n = nombre.trim();
    if (!n) {
      toast.error("Poné un nombre para la lista.");
      return;
    }
    if (filtered.length === 0) {
      toast.error("No hay miembros que cumplan los filtros.");
      return;
    }
    setSaving(true);
    const res = await authFetch("/api/admin/contact-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: n,
        descripcion: descripcion.trim() || null,
        member_ids: filtered.map((r) => r.id),
        filter_snapshot: filterSnap,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success(`Lista guardada (${filtered.length} contactos).`);
    setNombre("");
    setDescripcion("");
    await loadLists();
    setInnerTab("manage");
  };

  const removeList = async (id: string, title: string) => {
    const ok = await confirm({
      title: "Eliminar lista",
      message: `¿Eliminar «${title}»? Los snapshots guardados se pierden. No afecta a los usuarios en la base.`,
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      danger: true,
    });
    if (!ok) return;
    const res = await authFetch(`/api/admin/contact-lists/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Lista eliminada.");
    if (selectedId === id) {
      setSelectedId(null);
      setDetailMembers([]);
    }
    await loadLists();
  };

  const saveMeta = async () => {
    if (!selectedId) return;
    const n = editingName.trim();
    if (!n) {
      toast.error("El nombre no puede quedar vacío.");
      return;
    }
    setPatching(true);
    const res = await authFetch(`/api/admin/contact-lists/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: n,
        descripcion: editingDesc.trim() || null,
      }),
    });
    setPatching(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Lista actualizada.");
    setDetailTitle(n);
    await loadLists();
  };

  if (membersLoading && allMembers.length === 0) {
    return (
      <div style={{ padding: "32px 0" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ ...crm.pageSubtitle, marginBottom: 16, maxWidth: "none" }}>
        Cada contacto se guarda con <strong>todos los datos</strong> del momento (perfil, inscripciones, %, fechas).
        Usá el selector para pasar entre armar una lista nueva y revisar las que ya guardaste.
      </p>

      <nav style={subNavWrap} aria-label="Modo listas de contacto">
        <div style={crm.segmentRail}>
          <div className="xplora-admin-segment-scroll">
            <div
              className="xplora-admin-segment-track"
              style={crm.segmentTrack}
              role="tablist"
            >
              {INNER_TABS.map((tab) => {
                const active = innerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    title={tab.title}
                    className={`xplora-admin-seg${active ? " is-active" : ""}`}
                    style={crm.segmentBtn(active)}
                    onClick={() => setInnerTab(tab.id)}
                  >
                    <span style={crm.segmentLabel}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {innerTab === "create" ? (
        <>
          <p style={{ ...crm.hint, marginBottom: 18, maxWidth: "none", fontSize: 13 }}>
            Mismos filtros que «Ver miembros»: email, carrera, rango de % de asistencia y alumno UCEMA. Después elegí
            nombre y guardá.
          </p>
          <div style={{ ...card, width: "100%", boxSizing: "border-box" }}>
            <h3 style={cardTitle}>Nueva lista</h3>
            <Field
              label="Nombre de la lista"
              hint="Ej. Leads carrera X — mayo"
              value={nombre}
              onChange={setNombre}
              placeholder="Nombre obligatorio"
            />
            <Field
              label="Descripción (opcional)"
              hint="Nota interna para el equipo."
              value={descripcion}
              onChange={setDescripcion}
              placeholder=""
            />

            <div style={{ marginTop: 18 }}>
              <TwoCol>
                <Field
                  label="Buscar por email"
                  hint="Texto dentro del correo."
                  value={emailQuery}
                  onChange={setEmailQuery}
                  placeholder="ej. @gmail.com"
                />
                <Sel
                  label="Carrera"
                  hint="Filtrá por carrera declarada."
                  value={carreraFilter}
                  onChange={setCarreraFilter}
                  options={carreraOptions}
                />
              </TwoCol>
              <TwoCol>
                <Field
                  label="% asistencia — desde"
                  value={pctMin}
                  onChange={setPctMin}
                  placeholder="0–100"
                />
                <Field
                  label="% asistencia — hasta"
                  value={pctMax}
                  onChange={setPctMax}
                  placeholder="0–100"
                />
              </TwoCol>
              <TwoCol>
                <Sel
                  label="Alumno UCEMA"
                  hint="Según dato del formulario de alta."
                  value={esAlumnoCema}
                  onChange={(v) => setEsAlumnoCema(v as "" | "yes" | "no")}
                  options={[
                    { value: "", label: "Todos" },
                    { value: "yes", label: "Sí (UCEMA)" },
                    { value: "no", label: "No" },
                  ]}
                />
                <div aria-hidden />
              </TwoCol>
              {pctInvalid ? (
                <p style={{ ...crm.hint, marginTop: 8, color: "#9b2c20" }}>
                  El valor «desde» es mayor que «hasta»; se invierten al filtrar.
                </p>
              ) : null}
              {filtersActive ? (
                <div style={{ marginTop: 12 }}>
                  <button type="button" style={crm.secondaryBtn} onClick={clearFilters}>
                    Limpiar filtros
                  </button>
                </div>
              ) : null}
            </div>

            <p style={{ ...crm.pageSubtitle, marginTop: 18, marginBottom: 12 }}>
              <strong>{filtered.length.toLocaleString("es-AR")}</strong> miembros cumplen los filtros
              {pctBounds.lo != null || pctBounds.hi != null
                ? ` (rango % ${pctBounds.lo ?? "—"}–${pctBounds.hi ?? "—"})`
                : ""}
              .
            </p>

            <button
              type="button"
              className="xplora-admin-primary"
              style={{ ...crm.primaryBtn, opacity: saving ? 0.7 : 1 }}
              disabled={saving}
              onClick={() => void saveNewList()}
            >
              {saving ? "Guardando…" : "Guardar lista con snapshots"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ ...crm.hint, marginBottom: 18, maxWidth: "none", fontSize: 13 }}>
            Abrí una lista para ver los contactos congelados, exportar CSV o editar el título. Borrar solo elimina la lista
            guardada, no a los usuarios en la base.
          </p>

          <div style={{ ...card, width: "100%", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
              <h3 style={{ ...cardTitle, marginBottom: 0 }}>Listas guardadas</h3>
              {!listsLoading ? (
                <span style={{ fontSize: 13, color: "var(--ink-muted)", fontWeight: 600 }}>
                  {lists.length.toLocaleString("es-AR")}{" "}
                  {lists.length === 1 ? "lista" : "listas"}
                </span>
              ) : null}
            </div>
            {listsLoading ? (
              <div style={{ padding: "24px 0" }}>
                <Spinner />
              </div>
            ) : lists.length === 0 ? (
              <Empty
                title="Todavía no hay listas"
                text="Pasá a «Crear lista», aplicá filtros y guardá la primera."
              />
            ) : (
              <div className="xplora-admin-table-scroll">
                <table style={{ ...table, minWidth: "min(100%, 920px)", width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={th}>Nombre</th>
                      <th style={{ ...th, width: 96, textAlign: "right" }}>Contactos</th>
                      <th style={{ ...th, width: 130 }}>Actualizada</th>
                      <th style={{ ...th, width: 180 }} aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {lists.map((L) => (
                      <tr key={L.id}>
                        <td style={td}>
                          <strong>{L.nombre}</strong>
                          {L.descripcion ? (
                            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 6, lineHeight: 1.45 }}>
                              {L.descripcion}
                            </div>
                          ) : null}
                        </td>
                        <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {L.member_count.toLocaleString("es-AR")}
                        </td>
                        <td style={{ ...td, fontSize: 13, color: "var(--ink-muted)" }}>
                          {new Date(L.updated_at).toLocaleString("es-AR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td style={td}>
                          <button type="button" style={miniBtn} onClick={() => void openDetail(L.id, L.nombre)}>
                            Ver contactos
                          </button>
                          <button
                            type="button"
                            style={{
                              ...miniBtn,
                              marginLeft: 10,
                              color: "#9b2c20",
                              borderColor: "rgba(192,57,43,0.35)",
                            }}
                            onClick={() => void removeList(L.id, L.nombre)}
                          >
                            Borrar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {innerTab === "manage" && selectedId ? (
        <div style={{ ...card, marginTop: 24, width: "100%", boxSizing: "border-box" }}>
          <h3 style={cardTitle}>Lista: {detailTitle}</h3>
          <TwoCol>
            <Field label="Nombre" value={editingName} onChange={setEditingName} />
            <Field label="Descripción" value={editingDesc} onChange={setEditingDesc} />
          </TwoCol>
          <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              style={crm.secondaryBtn}
              disabled={patching}
              onClick={() => void saveMeta()}
            >
              {patching ? "Guardando…" : "Guardar nombre / descripción"}
            </button>
            <button
              type="button"
              style={crm.secondaryBtn}
              onClick={() =>
                exportSnapshotsCsv(
                  detailMembers.map((m) => ({ snapshot: m.snapshot })),
                  detailTitle,
                )
              }
              disabled={detailLoading || detailMembers.length === 0}
            >
              Descargar CSV
            </button>
            <button
              type="button"
              style={crm.secondaryBtn}
              onClick={() => {
                setSelectedId(null);
                setDetailMembers([]);
              }}
            >
              Cerrar vista
            </button>
          </div>

          {detailLoading ? (
            <div style={{ padding: 24 }}>
              <Spinner />
            </div>
          ) : detailMembers.length === 0 ? (
            <p style={{ ...crm.hint, marginTop: 16 }}>No hay filas en esta lista.</p>
          ) : (
            <>
              <p style={{ ...crm.pageSubtitle, marginTop: 16, marginBottom: 12 }}>
                {detailMembers.length.toLocaleString("es-AR")} contactos (datos congelados al guardar).
              </p>
              <div className="xplora-admin-table-scroll">
                <table style={{ ...table, minWidth: 720 }}>
                  <thead>
                    <tr>
                      <th style={th}>Nombre</th>
                      <th style={th}>Email</th>
                      <th style={th}>Carrera</th>
                      <th style={th}>Alumno UCEMA</th>
                      <th style={{ ...th, textAlign: "right" }}>Insc. / asist.</th>
                      <th style={{ ...th, textAlign: "right" }}>%</th>
                      <th style={th}>Inscripciones (eventos)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailMembers.map((m) => {
                      const r = m.snapshot.row;
                      const ins = r.inscripciones ?? [];
                      return (
                        <tr key={m.id}>
                          <td style={td}>{r.nombre || "—"}</td>
                          <td style={{ ...td, wordBreak: "break-all" }}>{r.email || "—"}</td>
                          <td style={td}>{r.carrera?.trim() ? r.carrera : "—"}</td>
                          <td style={td}>{r.es_alumno_cema ? "Sí" : "No"}</td>
                          <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                            {r.eventos_inscripto === 0
                              ? "—"
                              : `${r.eventos_inscripto} / ${r.eventos_asistio}`}
                          </td>
                          <td style={{ ...td, textAlign: "right" }}>
                            {r.pct_asistencia == null ? "—" : `${r.pct_asistencia}%`}
                          </td>
                          <td style={{ ...td, fontSize: 12, maxWidth: 280 }}>
                            {ins.length === 0
                              ? "—"
                              : ins
                                  .slice(0, 4)
                                  .map((x) => `${x.title}${x.asistio ? " ✓" : ""}`)
                                  .join(" · ")}
                            {ins.length > 4 ? ` +${ins.length - 4}` : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

const card: CSSProperties = {
  border: "1px solid rgba(26,16,40,0.1)",
  borderRadius: 16,
  padding: "20px 22px",
  background: "rgba(255,255,255,0.72)",
};

const cardTitle: CSSProperties = {
  fontFamily: "'Instrument Sans', sans-serif",
  fontSize: 15,
  fontWeight: 700,
  marginBottom: 16,
  color: "var(--ink)",
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

const th: CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "2px solid rgba(26,16,40,0.12)",
  color: "var(--ink-muted)",
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const td: CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid rgba(26,16,40,0.08)",
  verticalAlign: "top",
};

const miniBtn: CSSProperties = {
  ...crm.chipBtn,
  fontSize: 12,
  padding: "6px 12px",
};

const subNavWrap: CSSProperties = { marginBottom: 18 };
