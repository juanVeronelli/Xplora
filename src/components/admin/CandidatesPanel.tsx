import { useEffect, useMemo, useState } from "react";
import { authFetch, readApiError } from "../../lib/serverApi";
import { CrmSection, Spinner, Empty, Sel } from "./crm/CrmUi";
import { crm } from "./crm/crmTheme";
import { useConfirm, useToast } from "../../context/FeedbackContext";

type CandidateRow = {
  id: string;
  nombre: string;
  apellido: string;
  carrera: string;
  email: string;
  telefono: string;
  asistio_evento: boolean;
  linkedin_url: string | null;
  cv_url: string | null;
  motivacion: string;
  equipo_interes: string;
  estado: string;
  created_at: string;
};

type WaitlistRow = {
  id: string;
  email: string;
  nombre_completo: string | null;
  universidad: string | null;
  carrera: string | null;
  que_estan_creando: string | null;
  created_at: string;
};

type LeadView = "waitlist" | "miembros";

export default function CandidatesPanel() {
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [candRows, setCandRows] = useState<CandidateRow[]>([]);
  const [waitlistRows, setWaitlistRows] = useState<WaitlistRow[]>([]);
  const [view, setView] = useState<LeadView>("waitlist");
  const [openCandidate, setOpenCandidate] = useState<CandidateRow | null>(null);

  const viewOptions = useMemo(
    () => [
      { value: "waitlist", label: "Waitlist Startup Day" },
      { value: "miembros", label: "Candidatos al club" },
    ],
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [cRes, wRes] = await Promise.all([
        authFetch("/api/admin/candidatos"),
        authFetch("/api/admin/startup-day/waitlist"),
      ]);
      if (cancelled) return;
      if (!cRes.ok) {
        toast.error(await readApiError(cRes));
        setCandRows([]);
      } else {
        const j = (await cRes.json()) as { rows?: CandidateRow[] };
        setCandRows(j.rows ?? []);
      }
      if (!wRes.ok) {
        toast.error(await readApiError(wRes));
        setWaitlistRows([]);
      } else {
        const j = (await wRes.json()) as { rows?: WaitlistRow[] };
        setWaitlistRows(j.rows ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const empty =
    (view === "waitlist" && waitlistRows.length === 0) ||
    (view === "miembros" && candRows.length === 0);

  return (
    <CrmSection
      kicker="Inbound"
      title="Leads"
      subtitle="Waitlist de Startup Day y candidatos que quieren sumarse al club. Los sponsors tienen su propia vista."
      onNew={() => {}}
      showNew={false}
    >
      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ minWidth: 280 }}>
          <Sel
            label="Ver"
            value={view}
            options={viewOptions}
            onChange={(v) => setView(v as LeadView)}
          />
        </div>
        <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
          {view === "waitlist"
            ? `${waitlistRows.length} en waitlist Startup Day`
            : `${candRows.length} candidato(s) al club`}
        </span>
      </div>

      {loading ? (
        <Spinner />
      ) : empty ? (
        <Empty
          title="Todavía no hay registros"
          text="Cuando alguien complete el formulario, aparecerá acá."
        />
      ) : (
        <div className="xplora-admin-table-scroll" style={{ marginTop: 8 }}>
          <table
            style={{
              ...table,
              minWidth: view === "waitlist" ? 900 : 760,
            }}
          >
            <thead>
              <tr>
                <th style={th}>Fecha</th>
                {view === "waitlist" ? (
                  <>
                    <th style={th}>Nombre</th>
                    <th style={th}>Email</th>
                    <th style={th}>Universidad</th>
                    <th style={th}>Carrera</th>
                    <th style={th}>Qué están creando</th>
                  </>
                ) : (
                  <>
                    <th style={th}>Nombre</th>
                    <th style={th}>Email</th>
                    <th style={th}>Carrera</th>
                    <th style={th}>Teléfono</th>
                    <th style={th}>Asistió</th>
                    <th style={th}>LinkedIn</th>
                    <th style={th}>CV</th>
                    <th style={th}>Equipo</th>
                    <th style={th}>Estado</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {view === "waitlist"
                  ? waitlistRows.map((r) => (
                      <tr key={r.id}>
                        <td style={{ ...td, fontSize: 12, color: "var(--ink-muted)" }}>
                          {new Date(r.created_at).toLocaleString("es-AR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td style={td}>
                          <strong>{r.nombre_completo || "—"}</strong>
                        </td>
                        <td style={{ ...td, wordBreak: "break-all" as const }}>{r.email}</td>
                        <td style={td}>{r.universidad || "—"}</td>
                        <td style={td}>{r.carrera || "—"}</td>
                        <td style={{ ...td, maxWidth: 280 }}>{r.que_estan_creando || "—"}</td>
                      </tr>
                    ))
                : candRows.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setOpenCandidate(r)}
                      style={{ cursor: "pointer" }}
                      title="Abrir postulación"
                    >
                      <td style={{ ...td, fontSize: 12, color: "var(--ink-muted)" }}>
                        {new Date(r.created_at).toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td style={td}>
                        <strong>{`${r.nombre} ${r.apellido}`.trim()}</strong>
                      </td>
                      <td style={{ ...td, wordBreak: "break-all" as const }}>{r.email}</td>
                      <td style={td}>{r.carrera}</td>
                      <td style={td}>{r.telefono}</td>
                      <td style={td}>{r.asistio_evento ? "Sí" : "No"}</td>
                      <td style={td}>
                        {r.linkedin_url ? (
                          <a href={r.linkedin_url} target="_blank" rel="noreferrer" style={link}>
                            Ver
                          </a>
                        ) : (
                          ""
                        )}
                      </td>
                      <td style={td}>
                        {r.cv_url ? (
                          <a href={r.cv_url} target="_blank" rel="noreferrer" style={link}>
                            Descargar
                          </a>
                        ) : (
                          ""
                        )}
                      </td>
                      <td style={td}>{r.equipo_interes}</td>
                      <td style={td}>
                        <span style={badge}>{r.estado || "nuevo"}</span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {openCandidate ? (
        <CandidateDetailModal
          row={openCandidate}
          onClose={() => setOpenCandidate(null)}
          onDelete={async () => {
            const ok = await confirm({
              title: "Eliminar postulación",
              message: "Esto borra el registro de la base de datos. ¿Seguro querés eliminarla?",
              danger: true,
              confirmLabel: "Eliminar",
            });
            if (!ok) return;
            const res = await authFetch(`/api/admin/candidatos/${openCandidate.id}`, { method: "DELETE" });
            if (!res.ok) {
              toast.error(await readApiError(res));
              return;
            }
            setCandRows((prev) => prev.filter((x) => x.id !== openCandidate.id));
            setOpenCandidate(null);
            toast.success("Postulación eliminada.");
          }}
        />
      ) : null}
    </CrmSection>
  );
}

function CandidateDetailModal({
  row,
  onClose,
  onDelete,
}: {
  row: CandidateRow;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div style={modalBackdrop} role="dialog" aria-modal onClick={onClose}>
      <div style={modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={modalHead}>
          <div>
            <div style={modalKicker}>Miembros · Postulación</div>
            <div style={modalTitle}>{`${row.nombre} ${row.apellido}`.trim()}</div>
            <div style={modalSub}>
              {new Date(row.created_at).toLocaleString("es-AR", { dateStyle: "full", timeStyle: "short" })}
            </div>
          </div>
          <button type="button" style={xBtn} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div style={modalBody}>
          <div style={grid2}>
            <Info label="Email" value={row.email} />
            <Info label="Teléfono" value={row.telefono} />
            <Info label="Carrera" value={row.carrera} />
            <Info label="Asistió a eventos" value={row.asistio_evento ? "Sí" : "No"} />
            <Info
              label="LinkedIn"
              value={
                row.linkedin_url ? (
                  <a href={row.linkedin_url} target="_blank" rel="noreferrer" style={link}>
                    Abrir perfil
                  </a>
                ) : (
                  ""
                )
              }
            />
            <Info
              label="CV"
              value={
                row.cv_url ? (
                  <a href={row.cv_url} target="_blank" rel="noreferrer" style={link}>
                    Abrir CV
                  </a>
                ) : (
                  ""
                )
              }
            />
            <Info label="Equipo de interés" value={row.equipo_interes} />
            <Info label="Estado" value={row.estado || "nuevo"} />
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={longLabel}>¿Por qué quiere unirse?</div>
            <div style={longText}>{row.motivacion}</div>
          </div>
        </div>

        <div style={modalFoot}>
          <button type="button" style={dangerBtn} onClick={onDelete}>
            Eliminar de la base
          </button>
          <button type="button" style={closeBtn} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={infoBox}>
      <div style={infoLabel}>{label}</div>
      <div style={infoValue}>{value}</div>
    </div>
  );
}

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "2px solid rgba(26,16,40,0.12)",
  color: "var(--ink-muted)",
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const td: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid rgba(26,16,40,0.08)",
  color: "var(--ink)",
  verticalAlign: "top",
};

const badge: React.CSSProperties = {
  ...crm.chipBtn,
  display: "inline-block",
  fontSize: 12,
  padding: "6px 10px",
};

const link: React.CSSProperties = {
  color: "var(--purple)",
  fontWeight: 800,
  textDecoration: "none",
};

const modalBackdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(26,16,40,0.45)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  zIndex: 99999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 18,
};

const modalCard: React.CSSProperties = {
  width: "100%",
  maxWidth: 820,
  background: "#fff",
  borderRadius: 18,
  border: "1px solid rgba(26,16,40,0.10)",
  boxShadow: "0 24px 70px rgba(26,16,40,0.22)",
  overflow: "hidden",
  fontFamily: "'Instrument Sans', sans-serif",
};

const modalHead: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  padding: 18,
  borderBottom: "1px solid rgba(26,16,40,0.08)",
  background: "linear-gradient(135deg, rgba(96,62,249,0.06) 0%, rgba(255,255,255,0.92) 55%)",
};

const modalKicker: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--ink-muted)",
  marginBottom: 6,
};

const modalTitle: React.CSSProperties = {
  fontFamily: "'Fraunces', serif",
  fontSize: 20,
  fontWeight: 700,
  color: "var(--ink)",
  letterSpacing: "-0.02em",
};

const modalSub: React.CSSProperties = { marginTop: 6, fontSize: 12, color: "var(--ink-muted)" };

const xBtn: React.CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 22,
  lineHeight: 1,
  padding: 6,
  color: "var(--ink-muted)",
};

const modalBody: React.CSSProperties = { padding: 18 };

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const infoBox: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(26,16,40,0.10)",
  background: "rgba(250,248,245,0.6)",
  padding: 12,
};
const infoLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--ink-muted)",
};
const infoValue: React.CSSProperties = { marginTop: 8, fontSize: 14, color: "var(--ink)", wordBreak: "break-word" as const };

const longLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--ink-muted)",
  marginBottom: 8,
};
const longText: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(26,16,40,0.10)",
  background: "white",
  padding: 14,
  color: "var(--ink)",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap" as const,
};

const modalFoot: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  padding: 18,
  borderTop: "1px solid rgba(26,16,40,0.08)",
  background: "rgba(250,248,245,0.8)",
  flexWrap: "wrap",
};

const dangerBtn: React.CSSProperties = { ...crm.topDangerBtn, padding: "10px 14px", borderRadius: 12 };
const closeBtn: React.CSSProperties = { ...crm.secondaryBtn, padding: "10px 14px", borderRadius: 12 };

