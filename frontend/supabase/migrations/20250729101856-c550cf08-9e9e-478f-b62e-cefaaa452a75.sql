-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create system control states table
CREATE TABLE public.system_controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_id TEXT NOT NULL,
  component_id TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plant_id, component_id)
);

-- Enable RLS on system_controls
ALTER TABLE public.system_controls ENABLE ROW LEVEL SECURITY;

-- Create policies for system_controls (only admins can modify)
CREATE POLICY "Admins can manage system controls" 
ON public.system_controls 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = TRUE
  )
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_controls_updated_at
  BEFORE UPDATE ON public.system_controls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system control states for all components
INSERT INTO public.system_controls (plant_id, component_id, is_enabled) VALUES
  ('water', 'pump1', TRUE),
  ('water', 'pump2', TRUE),
  ('water', 'backup_pump', TRUE),
  ('water', 'valveA', TRUE),
  ('water', 'valveB', TRUE),
  ('water', 'tank', TRUE),
  ('water', 'filtration', TRUE),
  ('water', 'monitoring', TRUE),
  ('nuclear', 'reactor1', TRUE),
  ('nuclear', 'reactor2', TRUE),
  ('nuclear', 'turbine1', TRUE),
  ('nuclear', 'turbine2', TRUE),
  ('nuclear', 'coolantA', TRUE),
  ('nuclear', 'coolantB', TRUE),
  ('nuclear', 'containment', TRUE),
  ('grid', 'gen1', TRUE),
  ('grid', 'gen2', TRUE),
  ('grid', 'transA', TRUE),
  ('grid', 'transB', TRUE),
  ('grid', 'substation1', TRUE),
  ('grid', 'substation2', TRUE),
  ('grid', 'protection_system', TRUE),
  ('grid', 'load', TRUE);