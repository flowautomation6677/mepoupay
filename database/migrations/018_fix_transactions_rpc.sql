-- Execute isso no SQL Editor do seu Dashboard do Supabase (Cloud)

create or replace function public.match_transactions (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  user_id uuid,
  account_id uuid,
  category_id uuid,
  amount numeric,
  type text,
  description text,
  date date,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
language sql
as $$
  select
    transactions.id,
    transactions.user_id,
    transactions.account_id,
    transactions.category_id,
    transactions.amount,
    transactions.type,
    transactions.description,
    transactions.date,
    transactions.created_at,
    transactions.updated_at,
    1 - ((transactions.metadata->>'embedding')::vector <-> query_embedding) as similarity
  from transactions
  where (transactions.metadata->>'embedding') is not null
  and 1 - ((transactions.metadata->>'embedding')::vector <-> query_embedding) > match_threshold
  order by (transactions.metadata->>'embedding')::vector <-> query_embedding asc
  limit match_count;
$$;
