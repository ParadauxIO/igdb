create extension if not exists citext;

alter table public.users
    add column email citext;  -- temporarily nullable for backfill

-- Backfill from auth.users
update public.users u
set email = au.email
from auth.users au
where au.id = u.id;

-- Make it required and unique (auth enforces uniqueness already)
alter table public.users
    alter column email set not null;

create unique index if not exists users_email_unique on public.users(email);

create or replace function public.sync_public_users_email()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
as $$
begin
    if tg_op = 'INSERT' then
        insert into public.users (id, email, created_at, updated_at)
        values (new.id, new.email, now(), now())
        on conflict (id) do update
            set email = excluded.email,
                updated_at = now();

        return new;
    elsif tg_op = 'UPDATE' then
        -- Only act when email actually changes
        if new.email is distinct from old.email then
            update public.users
            set email = new.email,
                updated_at = now()
            where id = new.id;
        end if;
        return new;
    end if;

    return null;
end
$$;

-- Fire on new users and email changes in auth.users
drop trigger if exists trg_sync_public_users_email_ins on auth.users;
create trigger trg_sync_public_users_email_ins
    after insert on auth.users
    for each row execute function public.sync_public_users_email();

drop trigger if exists trg_sync_public_users_email_upd on auth.users;
create trigger trg_sync_public_users_email_upd
    after update of email on auth.users
    for each row execute function public.sync_public_users_email();