/**
 * Opciones del selector **Estado** en campañas (badge ámbar + emoji en el HTML).
 */
export type EmailCampaignEstadoId =
  | 'recordatorio'
  | 'nuevo_evento'
  | 'nuevo_workshop'
  | 'hackathon'
  | 'panel'
  | 'networking'
  | 'otro';

export const EMAIL_CAMPAIGN_ESTADO_OPTIONS: { value: EmailCampaignEstadoId; label: string }[] = [
  { value: 'recordatorio', label: 'Recordatorio' },
  { value: 'nuevo_evento', label: 'Nuevo evento' },
  { value: 'nuevo_workshop', label: 'Nuevo workshop' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'panel', label: 'Panel' },
  { value: 'networking', label: 'Networking' },
  { value: 'otro', label: 'Otro' },
];

export function labelForEstado(id: EmailCampaignEstadoId): string {
  return EMAIL_CAMPAIGN_ESTADO_OPTIONS.find(o => o.value === id)?.label ?? 'Otro';
}

export function emojiForEstado(id: EmailCampaignEstadoId): string {
  const map: Record<EmailCampaignEstadoId, string> = {
    recordatorio: '🔔',
    nuevo_evento: '✨',
    nuevo_workshop: '🛠️',
    hackathon: '💻',
    panel: '🎤',
    networking: '🤝',
    otro: '📌',
  };
  return map[id] ?? '📌';
}

