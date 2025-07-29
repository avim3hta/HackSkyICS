-- Add additional system components for better admin control

-- Insert turbine components for nuclear plant
INSERT INTO public.system_controls (plant_id, component_id, is_enabled) VALUES
  ('nuclear', 'turbine1', TRUE),
  ('nuclear', 'turbine2', TRUE)
ON CONFLICT (plant_id, component_id) DO NOTHING;

-- Add some additional components for comprehensive control
-- Water treatment additional components
INSERT INTO public.system_controls (plant_id, component_id, is_enabled) VALUES
  ('water', 'filtration', TRUE),
  ('water', 'monitoring', TRUE),
  ('water', 'backup_pump', TRUE)
ON CONFLICT (plant_id, component_id) DO NOTHING;

-- Grid additional components  
INSERT INTO public.system_controls (plant_id, component_id, is_enabled) VALUES
  ('grid', 'substation1', TRUE),
  ('grid', 'substation2', TRUE),
  ('grid', 'protection_system', TRUE)
ON CONFLICT (plant_id, component_id) DO NOTHING;
