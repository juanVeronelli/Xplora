/**
 * Email: redacción de campañas y vista «quién recibió el mail» en el mismo lugar (antes parte de Database).
 */
import { useEffect, useMemo, useState } from "react";
import { useStaffPermissions } from "../../context/StaffPermissionsContext";
import { hasAnyPermission } from "../../lib/crmPermissions";
import { CampaignAudiencePanel } from "./DatabasePanel";
import EmailCampaignEditor from "./EmailCampaignEditor";
import { SectionIntro } from "./crm/CrmUi";
import { crm } from "./crm/crmTheme";

type HubTab = "compose" | "reach";

export default function EmailCampaignsHub() {
  const { permissions } = useStaffPermissions();
  const canCompose = hasAnyPermission(permissions, ["email_campaigns"]);
  const canReach = hasAnyPermission(permissions, [
    "email_campaigns",
    "database_full",
    "database_campaign_sends_only",
  ]);

  const tabs = useMemo(() => {
    const t: { id: HubTab; label: string; title: string }[] = [];
    if (canCompose) {
      t.push({
        id: "compose",
        label: "Redactar campaña",
        title: "Plantillas HTML y vista previa",
      });
    }
    if (canReach) {
      t.push({
        id: "reach",
        label: "Quién recibió el mail",
        title: "Audiencia vs registros en campanias_envios",
      });
    }
    return t;
  }, [canCompose, canReach]);

  const [tab, setTab] = useState<HubTab>("compose");

  useEffect(() => {
    if (!canCompose && canReach) setTab("reach");
    if (canCompose && !canReach) setTab("compose");
  }, [canCompose, canReach]);

  if (tabs.length === 0) {
    return (
      <p style={{ ...crm.pageSubtitle, color: "var(--ink-muted)", marginTop: 8 }}>
        No tenés permisos para esta sección. Pedí acceso a campañas de email o a seguimiento de envíos.
      </p>
    );
  }

  const showSegment = tabs.length > 1;

  return (
    <>
      <SectionIntro
        kicker="Email"
        title="Campañas y seguimiento"
        subtitle="En «Redactar» guardás plantilla y vista previa; en «Quién recibió» elegís una campaña y comparás los miembros con los envíos registrados."
      />
      {showSegment ? (
        <nav style={{ marginBottom: 18 }} aria-label="Vistas de email">
          <div style={crm.segmentRail}>
            <div className="xplora-admin-segment-scroll">
              <div
                className="xplora-admin-segment-track"
                style={crm.segmentTrack}
                role="tablist"
              >
                {tabs.map((x) => {
                  const active = tab === x.id;
                  return (
                    <button
                      key={x.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      title={x.title}
                      className={`xplora-admin-seg${active ? " is-active" : ""}`}
                      style={crm.segmentBtn(active)}
                      onClick={() => setTab(x.id)}
                    >
                      <span style={crm.segmentLabel}>{x.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      ) : null}
      {tab === "compose" && canCompose ? <EmailCampaignEditor bare /> : null}
      {tab === "reach" && canReach ? <CampaignAudiencePanel /> : null}
    </>
  );
}
