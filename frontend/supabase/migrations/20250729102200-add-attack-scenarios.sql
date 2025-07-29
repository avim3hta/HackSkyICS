-- Create attack scenarios tracking table
CREATE TABLE public.attack_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_id TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  scenario_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plant_id, scenario_id)
);

-- Enable RLS on attack_scenarios
ALTER TABLE public.attack_scenarios ENABLE ROW LEVEL SECURITY;

-- Create policies for attack_scenarios (only admins can manage)
CREATE POLICY "Admins can manage attack scenarios" 
ON public.attack_scenarios 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = TRUE
  )
);

-- Insert default attack scenarios
INSERT INTO public.attack_scenarios (plant_id, scenario_id, scenario_name, is_active) VALUES
  ('water', 'dos', 'Launch DoS Attack', FALSE),
  ('water', 'control', 'Unauthorized Control', FALSE),
  ('water', 'manipulation', 'Data Manipulation', FALSE),
  ('nuclear', 'scram', 'Forced SCRAM Attack', FALSE),
  ('nuclear', 'coolant', 'Coolant System Breach', FALSE),
  ('nuclear', 'control', 'Control Rod Override', FALSE),
  ('grid', 'blackout', 'Coordinated Blackout', FALSE),
  ('grid', 'overload', 'System Overload', FALSE),
  ('grid', 'frequency', 'Frequency Attack', FALSE);

-- Create admin user (credentials: admin@hacksky.com / admin123)
-- Note: This is for demo purposes only. In production, use proper password management.
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@hacksky.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Make the admin user an admin in profiles
INSERT INTO public.profiles (user_id, email, is_admin)
SELECT u.id, u.email, TRUE
FROM auth.users u
WHERE u.email = 'admin@hacksky.com'
ON CONFLICT (user_id) DO UPDATE SET is_admin = TRUE;
