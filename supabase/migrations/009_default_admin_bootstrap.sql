-- Promote the designated default administrator when the matching auth user exists.
DO $$
DECLARE
  admin_role_id INT;
  target_user_id UUID;
BEGIN
  INSERT INTO public.roles (name, description)
  VALUES ('admin', 'Platform administrator')
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO admin_role_id
  FROM public.roles
  WHERE name = 'admin'
  LIMIT 1;

  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'm.a.sumon92@gmail.com'
  LIMIT 1;

  IF admin_role_id IS NULL OR target_user_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.users
  SET role_id = admin_role_id,
      is_active = TRUE,
      full_name = COALESCE(NULLIF(full_name, ''), 'MUMAIN AHMED'),
      updated_at = NOW()
  WHERE email = 'm.a.sumon92@gmail.com';

  IF NOT FOUND THEN
    INSERT INTO public.users (
      id,
      email,
      full_name,
      password_hash,
      role_id,
      is_active,
      updated_at
    )
    VALUES (
      target_user_id,
      'm.a.sumon92@gmail.com',
      'MUMAIN AHMED',
      'supabase_managed',
      admin_role_id,
      TRUE,
      NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET role_id = EXCLUDED.role_id,
        is_active = EXCLUDED.is_active,
        full_name = COALESCE(NULLIF(public.users.full_name, ''), EXCLUDED.full_name),
        updated_at = NOW();
  END IF;
END $$;