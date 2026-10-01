-- migration-005.sql — billing & event operations
-- Run once in Supabase SQL Editor. Adds quotations, invoices, payments, event checklists.
-- (Admin API uses the service-role key, so no RLS policies are required.)

create table if not exists quotations (
  id uuid primary key default gen_random_uuid(),
  quote_no text unique not null,
  client_name text not null,
  client_phone text,
  client_email text,
  event_title text,
  event_date date,
  venue text,
  items jsonb not null default '[]',
  discount numeric not null default 0,
  gst_percent numeric not null default 0,
  notes text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique not null,
  quotation_id uuid references quotations(id) on delete set null,
  client_name text not null,
  client_phone text,
  client_email text,
  event_title text,
  event_date date,
  venue text,
  items jsonb not null default '[]',
  discount numeric not null default 0,
  gst_percent numeric not null default 0,
  notes text,
  status text not null default 'unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  receipt_no text,
  amount numeric not null,
  mode text not null default 'UPI',
  paid_on date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists event_checklists (
  id uuid primary key default gen_random_uuid(),
  event_title text not null,
  event_date date,
  client_name text,
  items jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_event_date on invoices(event_date);
create index if not exists idx_payments_invoice on payments(invoice_id);
