-- Migration: Create RPC for WhatsApp Linking
-- -------------------------------------------------------------
-- DESCRIÇÃO: Cria funçao RPC para vincular número de WhatsApp.
-- Lógica: Adiciona ao array, garante unicidade e limite de 2.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.link_whatsapp(phone_input TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    current_numbers TEXT[];
BEGIN
    -- 1. Get Auth User ID
    user_id := auth.uid();
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Get Current Numbers
    SELECT whatsapp_numbers INTO current_numbers FROM public.profiles WHERE id = user_id;

    -- 3. Validation
    IF phone_input IS NULL OR length(phone_input) < 10 THEN
         RAISE EXCEPTION 'Invalid phone number';
    END IF;

    -- 4. Check if already exists
    IF phone_input = ANY(current_numbers) THEN
        RETURN; -- Already linked, do nothing
    END IF;

    -- 5. Check Limit
    IF cardinality(current_numbers) >= 2 THEN
        RAISE EXCEPTION 'Limit of 2 WhatsApp numbers reached';
    END IF;

    -- 6. Update Profile (Append)
    UPDATE public.profiles
    SET whatsapp_numbers = array_append(whatsapp_numbers, phone_input)
    WHERE id = user_id;

END;
$$;
