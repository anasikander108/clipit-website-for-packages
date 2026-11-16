-- Product renamed from Clipit to ClipXo. Safe to run more than once.
update public.website_settings set product_name = 'ClipXo' where id = 1 and product_name in ('', 'Clipit');
update public.packages set tagline = replace(tagline, 'Clipit', 'ClipXo') where tagline like '%Clipit%';
alter table public.website_settings alter column product_name set default 'ClipXo';
