-- Site Settings Table
-- Stores global app customizations managed by admins.
-- Each setting is a key/value row.

create table if not exists site_settings (
  key   text primary key,
  value text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed defaults (noop if already present)
insert into site_settings (key, value)
values
  ('project_name', 'Equinox'),
  ('hero_image_url', null)
on conflict (key) do nothing;

-- RLS
alter table site_settings enable row level security;

-- Anyone authenticated can read
create policy "Anyone can read site_settings"
  on site_settings for select
  using (true);

-- Only admins can write
create policy "Admins can manage site_settings"
  on site_settings for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
