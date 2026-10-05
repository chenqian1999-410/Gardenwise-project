create table if not exists plants (
  id uuid primary key default gen_random_uuid(),
  botanical_name text not null,
  common_name text,
  plant_type text not null,
  coverage_value_sqft numeric not null,
  suitable_style_tags text[] default '{}',
  sunlight_requirement text[] default '{}',
  mature_size text,
  description text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  garden_area numeric not null,
  uploaded_plan text,
  selected_style text not null,
  generated_result jsonb,
  created_at timestamptz default now()
);

create index if not exists plants_style_tags_idx on plants using gin (suitable_style_tags);
create index if not exists plants_sunlight_idx on plants using gin (sunlight_requirement);
