-- Expands the exam integrity event types to cover devtools/print shortcut
-- attempts and prolonged inactivity, alongside the existing tab-switch,
-- copy/paste, right-click, and fullscreen-exit checks.

alter table public.exam_integrity_events drop constraint if exists exam_integrity_events_event_type_check;

alter table public.exam_integrity_events add constraint exam_integrity_events_event_type_check
  check (event_type in (
    'tab_switch', 'copy_attempt', 'paste_attempt', 'right_click', 'fullscreen_exit',
    'devtools_attempt', 'print_attempt', 'idle_timeout'
  ));
