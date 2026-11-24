-- created: 2026-11-23T12:14:00-08:00
-- updated: 2026-11-23T20:30:00-08:00 — idempotent realtime for messages (+ likes)
-- App also polls every 2s while a chat is open.

do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then null;
    when others then
      if sqlerrm not like '%already member%' then
        raise;
      end if;
  end;

  begin
    alter publication supabase_realtime add table public.message_likes;
  exception
    when duplicate_object then null;
    when others then
      if sqlerrm not like '%already member%' then
        raise;
      end if;
  end;
end $$;
