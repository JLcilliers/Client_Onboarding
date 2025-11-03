create or replace function public.create_secret(
  p_company_id uuid,
  p_label text,
  p_secret_type text,
  p_secret_value text,
  p_created_by uuid,
  p_passphrase text
)
returns uuid
language plpgsql
as $$
declare
  v_secret_id uuid;
begin
  insert into public.secrets (
    company_id,
    label,
    secret_type,
    encrypted_value,
    created_by,
    created_at
  )
  values (
    p_company_id,
    p_label,
    p_secret_type,
    pgp_sym_encrypt(p_secret_value, p_passphrase),
    p_created_by,
    now()
  )
  returning id into v_secret_id;

  insert into public.audit_logs (
    actor,
    company_id,
    action,
    target_type,
    target_id,
    details,
    created_at
  )
  values (
    p_created_by,
    p_company_id,
    'secret_created',
    'secret',
    v_secret_id,
    jsonb_build_object('label', p_label, 'secret_type', p_secret_type),
    now()
  );

  return v_secret_id;
end;
$$;

create or replace function public.decrypt_secret(
  p_secret_id uuid,
  p_passphrase text
)
returns table (
  id uuid,
  company_id uuid,
  label text,
  secret_type text,
  secret_value text,
  created_at timestamptz
)
language sql
security definer
set search_path to public
as $$
  select
    s.id,
    s.company_id,
    s.label,
    s.secret_type,
    convert_from(pgp_sym_decrypt_bytea(s.encrypted_value, p_passphrase), 'utf-8') as secret_value,
    s.created_at
  from public.secrets s
  where s.id = p_secret_id;
$$;

create policy secrets_select_meta on public.secrets
for select using (public.is_member(company_id));
