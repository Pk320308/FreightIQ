/*
# Auto-create profile on user signup

1. New Function
- `handle_new_user()` — SECURITY DEFINER function that inserts a row into `profiles`
  when a new user is created in `auth.users`. Reads `full_name` from the user's
  metadata if available.

2. New Trigger
- `on_auth_user_created` — fires AFTER INSERT on `auth.users`, calls `handle_new_user()`.

This ensures a profile row always exists for every authenticated user, even if the
frontend insert fails or is skipped.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, organization)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'analyst',
    'FreightIQ Maritime'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
