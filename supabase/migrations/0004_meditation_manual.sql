-- Méditations: sessions added by hand (done without the app).
alter table public.meditation_sessions drop constraint meditation_sessions_kind_check;
alter table public.meditation_sessions
  add constraint meditation_sessions_kind_check check (kind in ('guided','free','sitting_type','manual'));

comment on column public.meditation_sessions.content_ref is
  'guided: "P19"; sitting_type: "<session id>:<minutes>" (e.g. "etape-3:30"); free and manual: null';
