-- More Nigerian property types, so tenants can filter by the kind of home they want.
alter type public.property_type add value if not exists 'self_contain' before 'apartment';
alter type public.property_type add value if not exists 'mini_flat' before 'apartment';
alter type public.property_type add value if not exists 'bungalow' after 'apartment';
alter type public.property_type add value if not exists 'terrace' after 'bungalow';
alter type public.property_type add value if not exists 'semi_detached' after 'terrace';
alter type public.property_type add value if not exists 'penthouse' after 'duplex';
