/**
 * Columna derecha del editor de campañas: barra de **asunto** (React) + cuerpo del mail (HTML parseado).
 * Usa `useDeferredValue` para no bloquear el tipeo al regenerar la maquetación.
 */
import { useDeferredValue, useMemo } from 'react';
import type { EmailTemplateBuildInput } from './emailTemplateInput';
import { buildEmailHtml } from './emailTemplateBuild';
import type { EmailTemplateId } from './emailTemplates/registry';
import { extractBodyInnerFromEmailHtml } from './emailPreviewDom';

export default function EmailHtmlLivePreview({
  templateId,
  input,
  asunto,
}: {
  templateId: EmailTemplateId;
  input: EmailTemplateBuildInput;
  asunto: string;
}) {
  const deferredInput = useDeferredValue(input);

  const bodyHtml = useMemo(() => {
    const full = buildEmailHtml(templateId, deferredInput);
    return extractBodyInnerFromEmailHtml(full);
  }, [templateId, deferredInput]);

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(26,16,40,0.1)',
        background: '#dcd8d0',
        boxShadow: '0 8px 32px rgba(26,16,40,0.06)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(180deg, #ffffff 0%, #faf9f7 100%)',
          borderBottom: '1px solid rgba(26,16,40,0.08)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
          }}
        >
          Asunto (bandeja de entrada)
        </p>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--ink)',
            lineHeight: 1.35,
            wordBreak: 'break-word',
          }}
        >
          {asunto.trim() || 'Sin asunto · escribí uno a la izquierda'}
        </p>
      </div>

      <div
        className="email-live-preview-sandbox"
        style={{
          minHeight: 420,
          maxHeight: 'min(72vh, 760px)',
          overflow: 'auto',
          background: '#e0dcd4',
          contain: 'content',
        }}
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </div>
  );
}
