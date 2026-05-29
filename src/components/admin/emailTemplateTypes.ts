/** Datos editables de la plantilla «Novedades plataforma». */

export interface PlatformFeatureBlock {
  icon: string;
  title: string;
  description: string;
}

export interface PlatformTemplateData {
  badgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  introText: string;
  features: [PlatformFeatureBlock, PlatformFeatureBlock, PlatformFeatureBlock];
  highlightText: string;
  ctaIntro: string;
  ctaLabel: string;
  ctaUrl: string;
}

export function defaultPlatformData(): PlatformTemplateData {
  return {
    badgeText: 'Novedades en Xplora',
    heroTitle: 'Tu ecosistema emprendedor, en un solo lugar',
    heroSubtitle: 'Eventos, charlas, bolsa de empleo y comunidad UCEMA.',
    introText:
      'Queríamos contarte las novedades que tenemos para vos en la plataforma. Entrá cuando quieras para explorar todo.',
    features: [
      {
        icon: '📅',
        title: 'Eventos y charlas',
        description: 'Agenda actualizada con encuentros presenciales y online.',
      },
      {
        icon: '💼',
        title: 'Bolsa de empleo',
        description: 'Ofertas de empresas del ecosistema, filtradas por área y modalidad.',
      },
      {
        icon: '🤝',
        title: 'Comunidad',
        description: 'Conectá con otros emprendedores y referentes del sector.',
      },
    ],
    highlightText: '💡 Tip: actualizá tu perfil para recibir avisos más relevantes.',
    ctaIntro: '¿Querés ver todo lo que hay esta semana?',
    ctaLabel: 'Ir a Xplora',
    ctaUrl: '',
  };
}
