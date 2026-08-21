/** Opciones de perfil miembro (skills / idiomas tipo LinkedIn). */

export const MEMBER_SKILL_POOL = [
  'Python',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'SQL',
  'Excel',
  'Power BI',
  'Tableau',
  'Figma',
  'Photoshop',
  'Illustrator',
  'Product Management',
  'Project Management',
  'Scrum',
  'Agile',
  'UX Research',
  'UI Design',
  'Copywriting',
  'Content Marketing',
  'SEO',
  'SEM',
  'Google Ads',
  'Meta Ads',
  'Sales',
  'Business Development',
  'Customer Success',
  'Data Analysis',
  'Machine Learning',
  'AI',
  'Java',
  'C#',
  'Go',
  'Rust',
  'Swift',
  'Kotlin',
  'AWS',
  'Azure',
  'GCP',
  'Docker',
  'Kubernetes',
  'Git',
  'Linux',
  'Communication',
  'Leadership',
  'Public Speaking',
  'Negotiation',
  'Teamwork',
  'Problem Solving',
  'Critical Thinking',
  'Accounting',
  'Finance',
  'Financial Modeling',
  'Venture Capital',
  'Startup Operations',
  'Growth Marketing',
  'Email Marketing',
  'CRM',
  'Salesforce',
  'HubSpot',
  'Notion',
  'Jira',
  'Canva',
  'Video Editing',
  'Premiere Pro',
  'After Effects',
  '3D Modeling',
  'Blender',
  'Unity',
  'Unreal Engine',
  'Blockchain',
  'Solidity',
  'Cybersecurity',
  'QA Testing',
  'Technical Writing',
  'Recruiting',
  'HR',
  'Legal Research',
  'Spanish',
  'English',
  'Portuguese',
  'Mandarin',
] as const;

export const MEMBER_LANGUAGE_POOL = [
  'Español',
  'Inglés',
  'Portugués',
  'Francés',
  'Italiano',
  'Alemán',
  'Chino mandarín',
  'Japonés',
  'Coreano',
  'Árabe',
  'Ruso',
  'Hebreo',
] as const;

export const MEMBER_LANGUAGE_LEVELS = [
  'Nativo',
  'Bilingüe',
  'C2',
  'C1',
  'B2',
  'B1',
  'A2',
  'A1',
  'Básico',
] as const;

export function memberYearOptions(from = 1990, to = new Date().getFullYear() + 8): string[] {
  const years: string[] = [];
  for (let y = to; y >= from; y -= 1) years.push(String(y));
  return years;
}

export function splitDisplayName(full: string): { firstName: string; lastName: string } {
  const t = full.trim().replace(/\s+/g, ' ');
  if (!t) return { firstName: '', lastName: '' };
  const i = t.indexOf(' ');
  if (i < 0) return { firstName: t, lastName: '' };
  return { firstName: t.slice(0, i), lastName: t.slice(i + 1) };
}

export function joinDisplayName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
}
