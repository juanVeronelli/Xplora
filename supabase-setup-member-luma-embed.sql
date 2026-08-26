-- Cuenta miembros: URL del embed Luma (“Anotate al próximo evento”).
-- Ejecutar en Supabase → SQL Editor.

alter table public.site_media
  add column if not exists member_luma_embed_src text;

comment on column public.site_media.member_luma_embed_src is
  'src del iframe Luma mostrado en /cuenta (overview). Vacío = ocultar bloque.';
