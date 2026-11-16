-- Show Pro (the recommended plan) in the middle: Starter, Pro, Business.
update public.packages set sort_order = case slug when 'starter' then 1 when 'pro' then 2 when 'business' then 3 else sort_order end;
