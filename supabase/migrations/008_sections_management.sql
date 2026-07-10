-- Idempotent section-management fields and duplicate protection.
alter table public.sections add column if not exists is_active boolean default true;
alter table public.sections add column if not exists updated_at timestamptz default now();

-- Only create the unique index when existing data is already clean. If
-- duplicates exist, the migration continues and emits a notice for cleanup.
do $$
begin
  if not exists (
    select 1
    from public.sections
    group by lower(name), grade_level, school_year
    having count(*) > 1
  ) then
    create unique index if not exists sections_unique_name_grade_sy
      on public.sections (lower(name), grade_level, school_year);
  else
    raise notice 'Skipped sections_unique_name_grade_sy: clean duplicate sections first.';
  end if;
end $$;
