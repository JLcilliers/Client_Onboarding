create policy company_members_select_self on public.company_members
for select using (user_id = auth.uid());

create policy company_members_modify_self on public.company_members
for all using (user_id = auth.uid())
with check (user_id = auth.uid());
