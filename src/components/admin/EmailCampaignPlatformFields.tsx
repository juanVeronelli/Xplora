/**
 * Campos de la plantilla «Novedades plataforma» (hero, bloques, aviso, CTA).
 */
import type { PlatformTemplateData } from './emailTemplateTypes';
import { emailSiteOrigin } from './emailCampaignHelpers';
import { Field, FormSection, TA, TwoCol } from './crm/CrmUi';

type Props = {
  platform: PlatformTemplateData;
  onPlatformChange: (next: PlatformTemplateData) => void;
};

export default function EmailCampaignPlatformFields({ platform, onPlatformChange }: Props) {
  const updateFeature = (
    index: 0 | 1 | 2,
    patch: Partial<PlatformTemplateData['features'][0]>,
  ) => {
    const features = [...platform.features] as PlatformTemplateData['features'];
    features[index] = { ...features[index], ...patch };
    onPlatformChange({ ...platform, features });
  };

  return (
    <FormSection title="Contenido · Novedades plataforma">
      <TwoCol>
        <Field
          label="Badge del hero"
          value={platform.badgeText}
          onChange={v => onPlatformChange({ ...platform, badgeText: v })}
        />
        <Field
          label="Link del botón principal"
          type="url"
          value={platform.ctaUrl}
          onChange={v => onPlatformChange({ ...platform, ctaUrl: v })}
          placeholder={emailSiteOrigin() || 'https://…'}
        />
      </TwoCol>
      <Field
        label="Título del hero"
        value={platform.heroTitle}
        onChange={v => onPlatformChange({ ...platform, heroTitle: v })}
      />
      <TA
        label="Subtítulo del hero"
        value={platform.heroSubtitle}
        onChange={v => onPlatformChange({ ...platform, heroSubtitle: v })}
        rows={2}
      />
      <TA
        label="Texto introductorio (cuerpo)"
        value={platform.introText}
        onChange={v => onPlatformChange({ ...platform, introText: v })}
        rows={3}
      />
      {[0, 1, 2].map(i => {
        const f = platform.features[i]!;
        const idx = i as 0 | 1 | 2;
        return (
          <div
            key={i}
            style={{
              marginTop: 16,
              padding: '16px 0 0',
              borderTop: '1px solid var(--border, #e5e7eb)',
            }}
          >
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
              Bloque destacado {i + 1}
            </p>
            <TwoCol>
              <Field
                label="Emoji / ícono"
                value={f.icon}
                onChange={v => updateFeature(idx, { icon: v })}
                placeholder="📅"
              />
              <Field
                label="Título"
                value={f.title}
                onChange={v => updateFeature(idx, { title: v })}
              />
            </TwoCol>
            <TA
              label="Descripción"
              value={f.description}
              onChange={v => updateFeature(idx, { description: v })}
              rows={2}
            />
          </div>
        );
      })}
      <TA
        label="Aviso destacado (caja amarilla)"
        value={platform.highlightText}
        onChange={v => onPlatformChange({ ...platform, highlightText: v })}
        rows={2}
      />
      <Field
        label="Texto sobre el botón CTA"
        value={platform.ctaIntro}
        onChange={v => onPlatformChange({ ...platform, ctaIntro: v })}
      />
      <Field
        label="Texto del botón CTA"
        value={platform.ctaLabel}
        onChange={v => onPlatformChange({ ...platform, ctaLabel: v })}
      />
    </FormSection>
  );
}
