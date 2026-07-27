-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text,
  email text,
  age integer,
  gender text,
  height_cm integer,
  current_weight_kg decimal(5,2),
  target_weight_kg decimal(5,2),
  body_fat_percent decimal(4,1),
  target_body_fat_percent decimal(4,1),
  activity_level text,
  goal text,
  daily_calorie_target integer,
  daily_protein_target_g integer,
  daily_carbs_target_g integer,
  daily_fat_target_g integer,
  daily_fiber_target_g integer,
  daily_water_target_ml integer
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  category text NOT NULL,
  serving_unit text NOT NULL DEFAULT '100g',
  serving_size_g decimal(6,2) NOT NULL DEFAULT 100,
  calories_per_serving decimal(6,2) NOT NULL DEFAULT 0,
  protein_g decimal(6,2) NOT NULL DEFAULT 0,
  carbs_g decimal(6,2) NOT NULL DEFAULT 0,
  fat_g decimal(6,2) NOT NULL DEFAULT 0,
  fiber_g decimal(6,2) NOT NULL DEFAULT 0,
  magnesium_mg decimal(6,2) DEFAULT 0,
  calcium_mg decimal(6,2) DEFAULT 0,
  iron_mg decimal(6,2) DEFAULT 0,
  zinc_mg decimal(6,2) DEFAULT 0,
  notes text,
  is_halal boolean DEFAULT true,
  UNIQUE(name, category)
);
GRANT SELECT ON public.foods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foods TO authenticated;
GRANT ALL ON public.foods TO service_role;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "foods readable" ON public.foods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "foods insertable auth" ON public.foods FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  total_calories decimal(7,2) DEFAULT 0,
  total_protein_g decimal(6,2) DEFAULT 0,
  total_carbs_g decimal(6,2) DEFAULT 0,
  total_fat_g decimal(6,2) DEFAULT 0,
  total_fiber_g decimal(6,2) DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meals TO authenticated;
GRANT ALL ON public.meals TO service_role;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meals" ON public.meals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.meal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  food_id uuid REFERENCES public.foods(id),
  food_name text,
  quantity_g decimal(7,2) NOT NULL,
  calories decimal(7,2) DEFAULT 0,
  protein_g decimal(6,2) DEFAULT 0,
  carbs_g decimal(6,2) DEFAULT 0,
  fat_g decimal(6,2) DEFAULT 0,
  fiber_g decimal(6,2) DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_items TO authenticated;
GRANT ALL ON public.meal_items TO service_role;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meal items" ON public.meal_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.meals m WHERE m.id = meal_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.meals m WHERE m.id = meal_id AND m.user_id = auth.uid()));

CREATE TABLE public.daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  total_calories decimal(7,2) DEFAULT 0,
  total_protein_g decimal(6,2) DEFAULT 0,
  total_carbs_g decimal(6,2) DEFAULT 0,
  total_fat_g decimal(6,2) DEFAULT 0,
  total_fiber_g decimal(6,2) DEFAULT 0,
  water_consumed_ml integer DEFAULT 0,
  notes text,
  UNIQUE(user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_logs TO authenticated;
GRANT ALL ON public.daily_logs TO service_role;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own daily logs" ON public.daily_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.daily_log_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id uuid NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  meal_id uuid REFERENCES public.meals(id) ON DELETE SET NULL,
  meal_time text NOT NULL,
  meal_name text,
  calories decimal(7,2) DEFAULT 0,
  protein_g decimal(6,2) DEFAULT 0,
  carbs_g decimal(6,2) DEFAULT 0,
  fat_g decimal(6,2) DEFAULT 0,
  fiber_g decimal(6,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_log_meals TO authenticated;
GRANT ALL ON public.daily_log_meals TO service_role;
ALTER TABLE public.daily_log_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own log meals" ON public.daily_log_meals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.daily_logs d WHERE d.id = daily_log_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.daily_logs d WHERE d.id = daily_log_id AND d.user_id = auth.uid()));

CREATE TABLE public.weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at date NOT NULL,
  weight_kg decimal(5,2) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, logged_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated;
GRANT ALL ON public.weight_logs TO service_role;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own weight" ON public.weight_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  amount_ml integer NOT NULL,
  logged_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs TO authenticated;
GRANT ALL ON public.water_logs TO service_role;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own water" ON public.water_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.foods (name, category, serving_unit, serving_size_g, calories_per_serving, protein_g, carbs_g, fat_g, fiber_g, magnesium_mg, calcium_mg, iron_mg, zinc_mg, notes) VALUES
('Chicken breast','Meat & Poultry','100g',100,165.0,31.0,0.0,3.6,0.0,29.0,15.0,1.0,1.0,'Mg:29mg Ca:15mg Fe:1mg Zn:1mg'),
('Chicken thigh','Meat & Poultry','100g',100,209.0,26.0,0.0,10.9,0.0,22.0,12.0,1.3,2.4,'Mg:22mg Ca:12mg Fe:1.3mg Zn:2.4mg'),
('Chicken drumstick','Meat & Poultry','100g',100,172.0,28.0,0.0,5.7,0.0,20.0,11.0,1.2,2.1,'Mg:20mg Ca:11mg Fe:1.2mg Zn:2.1mg'),
('Whole chicken','Meat & Poultry','100g',100,215.0,18.0,0.0,15.0,0.0,18.0,11.0,1.0,1.8,'Mg:18mg Ca:11mg Fe:1mg Zn:1.8mg'),
('Turkey breast','Meat & Poultry','100g',100,135.0,30.0,0.0,1.0,0.0,28.0,10.0,1.2,2.0,'Mg:28mg Ca:10mg Fe:1.2mg Zn:2mg'),
('Ground turkey','Meat & Poultry','100g',100,218.0,22.0,0.0,14.0,0.0,22.0,17.0,1.6,2.4,'Mg:22mg Ca:17mg Fe:1.6mg Zn:2.4mg'),
('Beef sirloin','Meat & Poultry','100g',100,207.0,26.0,0.0,11.0,0.0,22.0,18.0,2.7,5.4,'Mg:22mg Ca:18mg Fe:2.7mg Zn:5.4mg'),
('Ground beef (lean)','Meat & Poultry','100g',100,215.0,21.0,0.0,14.0,0.0,19.0,12.0,2.2,4.8,'Mg:19mg Ca:12mg Fe:2.2mg Zn:4.8mg'),
('Beef ribeye','Meat & Poultry','100g',100,291.0,24.0,0.0,21.0,0.0,20.0,10.0,2.1,5.0,'Mg:20mg Ca:10mg Fe:2.1mg Zn:5mg'),
('Beef tenderloin','Meat & Poultry','100g',100,247.0,28.0,0.0,14.0,0.0,24.0,14.0,3.0,5.5,'Mg:24mg Ca:14mg Fe:3mg Zn:5.5mg'),
('Lamb chop','Meat & Poultry','100g',100,294.0,25.0,0.0,21.0,0.0,23.0,17.0,1.9,4.5,'Mg:23mg Ca:17mg Fe:1.9mg Zn:4.5mg'),
('Lamb leg','Meat & Poultry','100g',100,258.0,28.0,0.0,16.0,0.0,26.0,15.0,2.1,5.0,'Mg:26mg Ca:15mg Fe:2.1mg Zn:5mg'),
('Ground lamb','Meat & Poultry','100g',100,283.0,17.0,0.0,23.0,0.0,19.0,16.0,1.6,3.8,'Mg:19mg Ca:16mg Fe:1.6mg Zn:3.8mg'),
('Veal','Meat & Poultry','100g',100,172.0,26.0,0.0,7.0,0.0,25.0,18.0,1.1,4.6,'Mg:25mg Ca:18mg Fe:1.1mg Zn:4.6mg'),
('Goat meat','Meat & Poultry','100g',100,143.0,27.0,0.0,3.1,0.0,25.0,15.0,2.8,4.0,'Mg:25mg Ca:15mg Fe:2.8mg Zn:4mg'),
('Camel meat','Meat & Poultry','100g',100,103.0,22.0,0.0,1.4,0.0,21.0,14.0,2.0,3.5,'Mg:21mg Ca:14mg Fe:2mg Zn:3.5mg'),
('Duck breast','Meat & Poultry','100g',100,201.0,23.0,0.0,11.0,0.0,21.0,11.0,2.7,2.7,'Mg:21mg Ca:11mg Fe:2.7mg Zn:2.7mg'),
('Rabbit','Meat & Poultry','100g',100,173.0,33.0,0.0,3.5,0.0,28.0,19.0,2.3,2.4,'Mg:28mg Ca:19mg Fe:2.3mg Zn:2.4mg'),
('Beef liver','Meat & Poultry','100g',100,135.0,21.0,4.0,3.6,0.0,19.0,6.0,6.5,4.0,'Mg:19mg Ca:6mg Fe:6.5mg Zn:4mg VitD:49IU B12:70µg'),
('Chicken liver','Meat & Poultry','100g',100,119.0,17.0,1.0,4.8,0.0,19.0,8.0,9.0,3.9,'Mg:19mg Ca:8mg Fe:9mg Zn:3.9mg B12:16µg'),
('Salmon (Atlantic)','Fish & Seafood','100g',100,208.0,20.0,0.0,13.0,0.0,27.0,12.0,0.8,0.6,'Mg:27mg Ca:12mg Fe:0.8mg Zn:0.6mg VitD:526IU Omega3:2.3g'),
('Tuna (yellowfin)','Fish & Seafood','100g',100,109.0,24.0,0.0,1.0,0.0,50.0,36.0,1.0,0.6,'Mg:50mg Ca:36mg Fe:1mg Zn:0.6mg VitD:40IU'),
('Canned tuna (water)','Fish & Seafood','100g',100,116.0,26.0,0.0,0.7,0.0,30.0,11.0,1.3,0.9,'Mg:30mg Ca:11mg Fe:1.3mg Zn:0.9mg'),
('Mackerel','Fish & Seafood','100g',100,205.0,19.0,0.0,14.0,0.0,76.0,66.0,1.6,0.6,'Mg:76mg Ca:66mg Fe:1.6mg Zn:0.6mg VitD:643IU Omega3:2.6g'),
('Sardines','Fish & Seafood','100g',100,208.0,25.0,0.0,11.0,0.0,39.0,382.0,2.9,1.3,'Mg:39mg Ca:382mg Fe:2.9mg Zn:1.3mg VitD:193IU'),
('Cod','Fish & Seafood','100g',100,82.0,18.0,0.0,0.7,0.0,32.0,16.0,0.4,0.5,'Mg:32mg Ca:16mg Fe:0.4mg Zn:0.5mg VitD:40IU'),
('Tilapia','Fish & Seafood','100g',100,96.0,20.0,0.0,1.7,0.0,27.0,14.0,0.5,0.4,'Mg:27mg Ca:14mg Fe:0.5mg Zn:0.4mg'),
('Trout','Fish & Seafood','100g',100,148.0,21.0,0.0,6.6,0.0,28.0,67.0,0.7,0.6,'Mg:28mg Ca:67mg Fe:0.7mg Zn:0.6mg VitD:759IU'),
('Sea bass','Fish & Seafood','100g',100,97.0,18.0,0.0,2.5,0.0,40.0,10.0,0.3,0.4,'Mg:40mg Ca:10mg Fe:0.3mg Zn:0.4mg'),
('Halibut','Fish & Seafood','100g',100,110.0,23.0,0.0,2.3,0.0,28.0,60.0,0.3,0.5,'Mg:28mg Ca:60mg Fe:0.3mg Zn:0.5mg VitD:190IU'),
('Haddock','Fish & Seafood','100g',100,87.0,19.0,0.0,0.7,0.0,41.0,42.0,0.3,0.4,'Mg:41mg Ca:42mg Fe:0.3mg Zn:0.4mg'),
('Herring','Fish & Seafood','100g',100,158.0,18.0,0.0,9.0,0.0,32.0,57.0,1.1,0.9,'Mg:32mg Ca:57mg Fe:1.1mg Zn:0.9mg VitD:214IU Omega3:1.7g'),
('Anchovy','Fish & Seafood','100g',100,131.0,20.0,0.0,4.8,0.0,41.0,147.0,3.2,1.7,'Mg:41mg Ca:147mg Fe:3.2mg Zn:1.7mg'),
('Shrimp','Fish & Seafood','100g',100,99.0,24.0,0.2,0.3,0.0,35.0,70.0,0.5,1.1,'Mg:35mg Ca:70mg Fe:0.5mg Zn:1.1mg'),
('Crab','Fish & Seafood','100g',100,97.0,19.0,0.0,1.8,0.0,34.0,89.0,0.7,3.6,'Mg:34mg Ca:89mg Fe:0.7mg Zn:3.6mg'),
('Squid','Fish & Seafood','100g',100,92.0,16.0,3.1,1.4,0.0,33.0,32.0,0.7,1.5,'Mg:33mg Ca:32mg Fe:0.7mg Zn:1.5mg'),
('Lobster','Fish & Seafood','100g',100,89.0,19.0,0.0,0.9,0.0,37.0,61.0,0.3,2.9,'Mg:37mg Ca:61mg Fe:0.3mg Zn:2.9mg'),
('Catfish','Fish & Seafood','100g',100,95.0,16.0,0.0,2.8,0.0,23.0,14.0,0.3,0.7,'Mg:23mg Ca:14mg Fe:0.3mg Zn:0.7mg VitD:424IU'),
('Whole egg','Eggs & Dairy','piece',50.0,72.0,6.3,0.4,5.0,0.0,6.0,28.0,0.9,0.6,'Mg:6mg Ca:28mg Fe:0.9mg Zn:0.6mg VitD:41IU'),
('Egg white','Eggs & Dairy','piece',33.0,17.0,3.6,0.2,0.1,0.0,4.0,2.0,0.0,0.0,'Mg:4mg Ca:2mg Fe:0mg Zn:0mg'),
('Egg yolk','Eggs & Dairy','piece',17.0,55.0,2.7,0.6,4.5,0.0,0,22.0,0.9,0,'Ca:22mg Fe:0.9mg VitD:37IU B12:0.3µg'),
('Greek yogurt (plain)','Eggs & Dairy','100g',100,59.0,10.0,3.6,0.4,0.0,11.0,111.0,0.1,0.5,'Mg:11mg Ca:111mg Fe:0.1mg Zn:0.5mg B12:0.4µg'),
('Cottage cheese (low fat)','Eggs & Dairy','100g',100,72.0,12.0,3.4,1.0,0.0,11.0,83.0,0.1,0.4,'Mg:11mg Ca:83mg Fe:0.1mg Zn:0.4mg B12:0.4µg'),
('Whole milk','Eggs & Dairy','ml',100,61.0,3.2,4.8,3.3,0.0,10.0,113.0,0.03,0.4,'Mg:10mg Ca:113mg Fe:0.03mg Zn:0.4mg VitD:2IU'),
('Skimmed milk','Eggs & Dairy','ml',100,34.0,3.4,5.0,0.1,0.0,11.0,122.0,0.03,0.4,'Mg:11mg Ca:122mg Fe:0.03mg Zn:0.4mg'),
('Cheddar cheese','Eggs & Dairy','100g',100,403.0,25.0,1.3,33.0,0.0,28.0,721.0,0.7,3.1,'Mg:28mg Ca:721mg Fe:0.7mg Zn:3.1mg'),
('Mozzarella','Eggs & Dairy','100g',100,280.0,28.0,2.2,17.0,0.0,20.0,505.0,0.4,2.9,'Mg:20mg Ca:505mg Fe:0.4mg Zn:2.9mg'),
('Ricotta','Eggs & Dairy','100g',100,174.0,11.0,3.0,13.0,0.0,15.0,207.0,0.4,1.2,'Mg:15mg Ca:207mg Fe:0.4mg Zn:1.2mg'),
('Plain yogurt','Eggs & Dairy','100g',100,61.0,3.5,4.7,3.3,0.0,12.0,121.0,0.1,0.6,'Mg:12mg Ca:121mg Fe:0.1mg Zn:0.6mg B12:0.4µg'),
('Kefir','Eggs & Dairy','ml',100,61.0,3.3,4.5,3.3,0.0,14.0,120.0,0.1,0.4,'Mg:14mg Ca:120mg Fe:0.1mg Zn:0.4mg B12:0.5µg'),
('Butter','Eggs & Dairy','100g',100,717.0,0.9,0.1,81.0,0.0,0,24.0,0,0,'Ca:24mg VitD:60IU'),
('White rice (cooked)','Grains & Cereals','100g',100,130.0,2.7,28.0,0.3,0.4,12.0,10.0,0.2,0.5,'Mg:12mg Ca:10mg Fe:0.2mg Zn:0.5mg'),
('Brown rice (cooked)','Grains & Cereals','100g',100,123.0,2.7,26.0,1.0,1.8,44.0,10.0,0.5,0.6,'Mg:44mg Ca:10mg Fe:0.5mg Zn:0.6mg B6:0.1mg'),
('Oats (dry)','Grains & Cereals','100g',100,389.0,17.0,66.0,7.0,10.0,177.0,54.0,4.7,4.0,'Mg:177mg Ca:54mg Fe:4.7mg Zn:4mg B1:0.8mg'),
('Oats (cooked)','Grains & Cereals','100g',100,71.0,2.5,12.0,1.4,1.7,26.0,10.0,0.7,0.6,'Mg:26mg Ca:10mg Fe:0.7mg Zn:0.6mg'),
('Quinoa (cooked)','Grains & Cereals','100g',100,120.0,4.4,22.0,1.9,2.8,64.0,17.0,1.5,1.1,'Mg:64mg Ca:17mg Fe:1.5mg Zn:1.1mg'),
('Whole wheat bread','Grains & Cereals','piece',30.0,69.0,3.5,12.0,1.0,1.9,23.0,24.0,0.9,0.5,'Mg:23mg Ca:24mg Fe:0.9mg Zn:0.5mg'),
('White bread','Grains & Cereals','piece',30.0,80.0,2.7,15.0,1.0,0.6,6.0,57.0,0.9,0.2,'Mg:6mg Ca:57mg Fe:0.9mg Zn:0.2mg'),
('Pasta (cooked)','Grains & Cereals','100g',100,131.0,5.0,25.0,1.1,1.8,18.0,7.0,1.3,0.5,'Mg:18mg Ca:7mg Fe:1.3mg Zn:0.5mg'),
('Whole wheat pasta (cooked)','Grains & Cereals','100g',100,124.0,5.3,27.0,0.5,3.9,47.0,21.0,1.4,1.1,'Mg:47mg Ca:21mg Fe:1.4mg Zn:1.1mg'),
('Couscous (cooked)','Grains & Cereals','100g',100,112.0,3.8,23.0,0.2,1.4,10.0,8.0,0.4,0.3,'Mg:10mg Ca:8mg Fe:0.4mg Zn:0.3mg'),
('Barley (cooked)','Grains & Cereals','100g',100,123.0,2.3,28.0,0.4,3.8,22.0,11.0,1.3,0.8,'Mg:22mg Ca:11mg Fe:1.3mg Zn:0.8mg'),
('Bulgur wheat (cooked)','Grains & Cereals','100g',100,83.0,3.1,19.0,0.2,4.5,32.0,10.0,1.0,0.6,'Mg:32mg Ca:10mg Fe:1mg Zn:0.6mg'),
('Millet (cooked)','Grains & Cereals','100g',100,119.0,3.5,23.0,1.0,1.3,44.0,3.0,0.6,0.9,'Mg:44mg Ca:3mg Fe:0.6mg Zn:0.9mg'),
('Corn/maize (cooked)','Grains & Cereals','100g',100,86.0,3.3,19.0,1.4,2.0,37.0,2.0,0.5,0.5,'Mg:37mg Ca:2mg Fe:0.5mg Zn:0.5mg'),
('Buckwheat (cooked)','Grains & Cereals','100g',100,92.0,3.4,20.0,0.6,2.7,51.0,7.0,0.8,0.6,'Mg:51mg Ca:7mg Fe:0.8mg Zn:0.6mg'),
('Spelt (cooked)','Grains & Cereals','100g',100,127.0,5.5,26.0,0.9,3.9,55.0,19.0,1.6,1.6,'Mg:55mg Ca:19mg Fe:1.6mg Zn:1.6mg'),
('Rye bread','Grains & Cereals','piece',30.0,83.0,2.7,15.0,1.1,1.9,20.0,20.0,0.8,0.5,'Mg:20mg Ca:20mg Fe:0.8mg Zn:0.5mg'),
('Cornflakes','Grains & Cereals','100g',100,357.0,7.5,84.0,0.4,3.8,6.0,1.0,8.0,0.3,'Mg:6mg Ca:1mg Fe:8mg Zn:0.3mg'),
('Semolina (dry)','Grains & Cereals','100g',100,360.0,13.0,73.0,1.0,3.9,47.0,17.0,1.8,1.1,'Mg:47mg Ca:17mg Fe:1.8mg Zn:1.1mg'),
('Tortilla (corn)','Grains & Cereals','piece',26.0,58.0,1.5,12.0,0.7,1.4,12.0,46.0,0.4,0.2,'Mg:12mg Ca:46mg Fe:0.4mg Zn:0.2mg'),
('Chickpeas (cooked)','Legumes & Pulses','100g',100,164.0,8.9,27.0,2.6,7.6,48.0,49.0,2.9,1.5,'Mg:48mg Ca:49mg Fe:2.9mg Zn:1.5mg B6:0.1mg'),
('Black beans (cooked)','Legumes & Pulses','100g',100,132.0,8.9,24.0,0.5,8.7,70.0,27.0,2.1,1.0,'Mg:70mg Ca:27mg Fe:2.1mg Zn:1mg'),
('Red lentils (cooked)','Legumes & Pulses','100g',100,116.0,9.0,20.0,0.4,7.9,36.0,19.0,3.3,1.3,'Mg:36mg Ca:19mg Fe:3.3mg Zn:1.3mg Folate:181µg'),
('Green lentils (cooked)','Legumes & Pulses','100g',100,116.0,9.0,20.0,0.4,7.9,36.0,19.0,3.3,1.3,'Mg:36mg Ca:19mg Fe:3.3mg Zn:1.3mg'),
('Kidney beans (cooked)','Legumes & Pulses','100g',100,127.0,8.7,23.0,0.5,7.4,45.0,43.0,2.9,1.0,'Mg:45mg Ca:43mg Fe:2.9mg Zn:1mg'),
('Fava beans (cooked)','Legumes & Pulses','100g',100,110.0,7.6,20.0,0.4,5.4,43.0,36.0,1.5,0.9,'Mg:43mg Ca:36mg Fe:1.5mg Zn:0.9mg'),
('Edamame (cooked)','Legumes & Pulses','100g',100,121.0,11.0,9.0,5.2,5.2,64.0,60.0,2.3,1.4,'Mg:64mg Ca:60mg Fe:2.3mg Zn:1.4mg'),
('Peas (cooked)','Legumes & Pulses','100g',100,84.0,5.4,15.0,0.4,5.7,33.0,27.0,1.5,1.2,'Mg:33mg Ca:27mg Fe:1.5mg Zn:1.2mg VitC:14mg'),
('White beans (cooked)','Legumes & Pulses','100g',100,139.0,9.7,25.0,0.4,6.3,63.0,90.0,3.7,1.0,'Mg:63mg Ca:90mg Fe:3.7mg Zn:1mg'),
('Pinto beans (cooked)','Legumes & Pulses','100g',100,143.0,9.0,26.0,0.7,9.0,50.0,46.0,2.2,1.1,'Mg:50mg Ca:46mg Fe:2.2mg Zn:1.1mg'),
('Mung beans (cooked)','Legumes & Pulses','100g',100,105.0,7.2,19.0,0.4,7.6,48.0,27.0,1.4,0.8,'Mg:48mg Ca:27mg Fe:1.4mg Zn:0.8mg'),
('Soybean (cooked)','Legumes & Pulses','100g',100,173.0,17.0,10.0,9.0,6.0,86.0,175.0,5.1,1.0,'Mg:86mg Ca:175mg Fe:5.1mg Zn:1mg'),
('Tofu (firm)','Legumes & Pulses','100g',100,76.0,8.1,1.9,4.8,0.3,30.0,350.0,5.4,0.8,'Mg:30mg Ca:350mg Fe:5.4mg Zn:0.8mg'),
('Tempeh','Legumes & Pulses','100g',100,193.0,19.0,9.4,11.0,9.0,81.0,111.0,2.7,1.1,'Mg:81mg Ca:111mg Fe:2.7mg Zn:1.1mg'),
('Hummus','Legumes & Pulses','100g',100,177.0,7.9,14.0,9.6,6.0,71.0,38.0,2.4,1.1,'Mg:71mg Ca:38mg Fe:2.4mg Zn:1.1mg'),
('Almonds','Nuts & Seeds','100g',100,579.0,21.0,22.0,50.0,12.0,270.0,264.0,3.7,3.1,'Mg:270mg Ca:264mg Fe:3.7mg Zn:3.1mg VitE:26mg'),
('Walnuts','Nuts & Seeds','100g',100,654.0,15.0,14.0,65.0,6.7,158.0,98.0,2.9,3.1,'Mg:158mg Ca:98mg Fe:2.9mg Zn:3.1mg Omega3:9.1g'),
('Cashews','Nuts & Seeds','100g',100,553.0,18.0,30.0,44.0,3.3,292.0,37.0,6.7,5.8,'Mg:292mg Ca:37mg Fe:6.7mg Zn:5.8mg'),
('Peanuts','Nuts & Seeds','100g',100,567.0,26.0,16.0,49.0,8.5,168.0,92.0,4.6,3.3,'Mg:168mg Ca:92mg Fe:4.6mg Zn:3.3mg'),
('Peanut butter','Nuts & Seeds','tbsp',32.0,188.0,8.0,6.0,16.0,1.9,54.0,17.0,0.6,1.0,'Mg:54mg Ca:17mg Fe:0.6mg Zn:1mg'),
('Pistachios','Nuts & Seeds','100g',100,562.0,20.0,28.0,45.0,10.0,121.0,105.0,3.9,2.2,'Mg:121mg Ca:105mg Fe:3.9mg Zn:2.2mg B6:1.7mg'),
('Brazil nuts','Nuts & Seeds','100g',100,659.0,14.0,12.0,67.0,7.5,376.0,160.0,2.4,4.1,'Mg:376mg Ca:160mg Fe:2.4mg Zn:4.1mg Se:1917µg'),
('Hazelnuts','Nuts & Seeds','100g',100,628.0,15.0,17.0,61.0,9.7,163.0,114.0,4.7,2.5,'Mg:163mg Ca:114mg Fe:4.7mg Zn:2.5mg VitE:15mg'),
('Macadamia nuts','Nuts & Seeds','100g',100,718.0,7.9,14.0,76.0,8.6,130.0,85.0,3.7,1.3,'Mg:130mg Ca:85mg Fe:3.7mg Zn:1.3mg'),
('Pine nuts','Nuts & Seeds','100g',100,673.0,14.0,13.0,68.0,3.7,251.0,16.0,5.5,6.5,'Mg:251mg Ca:16mg Fe:5.5mg Zn:6.5mg'),
('Sunflower seeds','Nuts & Seeds','100g',100,584.0,21.0,20.0,51.0,8.6,325.0,78.0,5.2,5.0,'Mg:325mg Ca:78mg Fe:5.2mg Zn:5mg VitE:35mg'),
('Pumpkin seeds','Nuts & Seeds','100g',100,559.0,30.0,11.0,49.0,6.0,592.0,46.0,8.8,7.6,'Mg:592mg Ca:46mg Fe:8.8mg Zn:7.6mg'),
('Flaxseeds','Nuts & Seeds','100g',100,534.0,18.0,29.0,42.0,27.0,392.0,255.0,5.7,4.3,'Mg:392mg Ca:255mg Fe:5.7mg Zn:4.3mg Omega3:22.8g'),
('Chia seeds','Nuts & Seeds','100g',100,486.0,17.0,42.0,31.0,34.0,335.0,631.0,7.7,4.6,'Mg:335mg Ca:631mg Fe:7.7mg Zn:4.6mg Omega3:17.5g'),
('Sesame seeds','Nuts & Seeds','100g',100,573.0,17.0,23.0,50.0,11.0,351.0,975.0,14.6,7.8,'Mg:351mg Ca:975mg Fe:14.6mg Zn:7.8mg'),
('Hemp seeds','Nuts & Seeds','100g',100,553.0,32.0,8.7,49.0,4.0,700.0,70.0,7.9,9.9,'Mg:700mg Ca:70mg Fe:7.9mg Zn:9.9mg Omega3:8.7g'),
('Tahini (sesame paste)','Nuts & Seeds','100g',100,595.0,17.0,21.0,54.0,9.3,95.0,426.0,8.9,4.6,'Mg:95mg Ca:426mg Fe:8.9mg Zn:4.6mg'),
('Broccoli','Vegetables','100g',100,34.0,2.8,7.0,0.4,2.6,21.0,47.0,0.7,0.4,'Mg:21mg Ca:47mg Fe:0.7mg Zn:0.4mg VitC:89mg'),
('Spinach','Vegetables','100g',100,23.0,2.9,3.6,0.4,2.2,79.0,99.0,2.7,0.5,'Mg:79mg Ca:99mg Fe:2.7mg Zn:0.5mg VitC:28mg'),
('Kale','Vegetables','100g',100,49.0,4.3,9.0,0.9,3.6,47.0,150.0,1.5,0.6,'Mg:47mg Ca:150mg Fe:1.5mg Zn:0.6mg VitC:120mg'),
('Sweet potato','Vegetables','100g',100,86.0,1.6,20.0,0.1,3.0,25.0,30.0,0.6,0.3,'Mg:25mg Ca:30mg Fe:0.6mg Zn:0.3mg VitA:961µg'),
('White potato','Vegetables','100g',100,77.0,2.0,17.0,0.1,2.2,23.0,12.0,0.8,0.3,'Mg:23mg Ca:12mg Fe:0.8mg Zn:0.3mg VitC:20mg'),
('Carrot','Vegetables','100g',100,41.0,0.9,10.0,0.2,2.8,12.0,33.0,0.3,0.2,'Mg:12mg Ca:33mg Fe:0.3mg Zn:0.2mg VitA:835µg'),
('Bell pepper (red)','Vegetables','100g',100,31.0,1.0,7.0,0.3,2.1,12.0,7.0,0.4,0.3,'Mg:12mg Ca:7mg Fe:0.4mg Zn:0.3mg VitC:128mg'),
('Tomato','Vegetables','100g',100,18.0,0.9,3.9,0.2,1.2,11.0,10.0,0.3,0.2,'Mg:11mg Ca:10mg Fe:0.3mg Zn:0.2mg VitC:14mg'),
('Zucchini','Vegetables','100g',100,17.0,1.2,3.1,0.3,1.0,18.0,16.0,0.4,0.3,'Mg:18mg Ca:16mg Fe:0.4mg Zn:0.3mg VitC:18mg'),
('Cucumber','Vegetables','100g',100,16.0,0.7,3.6,0.1,0.5,13.0,16.0,0.3,0.2,'Mg:13mg Ca:16mg Fe:0.3mg Zn:0.2mg VitC:3mg'),
('Eggplant','Vegetables','100g',100,25.0,1.0,6.0,0.2,3.0,14.0,9.0,0.2,0.2,'Mg:14mg Ca:9mg Fe:0.2mg Zn:0.2mg'),
('Onion','Vegetables','100g',100,40.0,1.1,9.3,0.1,1.7,10.0,23.0,0.2,0.2,'Mg:10mg Ca:23mg Fe:0.2mg Zn:0.2mg'),
('Garlic','Vegetables','100g',100,149.0,6.4,33.0,0.5,2.1,25.0,181.0,1.7,1.2,'Mg:25mg Ca:181mg Fe:1.7mg Zn:1.2mg'),
('Green beans','Vegetables','100g',100,31.0,1.8,7.0,0.2,3.4,25.0,37.0,1.0,0.2,'Mg:25mg Ca:37mg Fe:1mg Zn:0.2mg VitC:12mg'),
('Cauliflower','Vegetables','100g',100,25.0,1.9,5.0,0.3,2.0,15.0,22.0,0.4,0.3,'Mg:15mg Ca:22mg Fe:0.4mg Zn:0.3mg VitC:46mg'),
('Asparagus','Vegetables','100g',100,20.0,2.2,3.9,0.1,2.1,14.0,24.0,2.1,0.5,'Mg:14mg Ca:24mg Fe:2.1mg Zn:0.5mg Folate:52µg'),
('Brussels sprouts','Vegetables','100g',100,43.0,3.4,9.0,0.3,3.8,23.0,42.0,1.4,0.4,'Mg:23mg Ca:42mg Fe:1.4mg Zn:0.4mg VitC:85mg'),
('Beet','Vegetables','100g',100,43.0,1.6,10.0,0.2,2.8,23.0,16.0,0.8,0.4,'Mg:23mg Ca:16mg Fe:0.8mg Zn:0.4mg Folate:109µg'),
('Pumpkin','Vegetables','100g',100,26.0,1.0,6.5,0.1,0.5,12.0,21.0,0.8,0.3,'Mg:12mg Ca:21mg Fe:0.8mg Zn:0.3mg VitA:426µg'),
('Celery','Vegetables','100g',100,16.0,0.7,3.0,0.2,1.6,11.0,40.0,0.2,0.1,'Mg:11mg Ca:40mg Fe:0.2mg Zn:0.1mg'),
('Artichoke','Vegetables','100g',100,47.0,3.3,11.0,0.2,5.4,60.0,44.0,1.3,0.5,'Mg:60mg Ca:44mg Fe:1.3mg Zn:0.5mg'),
('Leek','Vegetables','100g',100,61.0,1.5,14.0,0.3,1.8,28.0,59.0,2.1,0.1,'Mg:28mg Ca:59mg Fe:2.1mg Zn:0.1mg VitC:12mg'),
('Cabbage','Vegetables','100g',100,25.0,1.3,6.0,0.1,2.5,12.0,40.0,0.5,0.2,'Mg:12mg Ca:40mg Fe:0.5mg Zn:0.2mg VitC:36mg'),
('Mushroom (white)','Vegetables','100g',100,22.0,3.1,3.3,0.3,1.0,9.0,3.0,0.5,0.5,'Mg:9mg Ca:3mg Fe:0.5mg Zn:0.5mg VitD:7IU'),
('Shiitake mushroom','Vegetables','100g',100,34.0,2.2,6.8,0.5,2.5,20.0,2.0,0.4,1.3,'Mg:20mg Ca:2mg Fe:0.4mg Zn:1.3mg VitD:18IU'),
('Corn (fresh)','Vegetables','100g',100,86.0,3.3,19.0,1.4,2.0,37.0,2.0,0.5,0.5,'Mg:37mg Ca:2mg Fe:0.5mg Zn:0.5mg'),
('Lettuce (romaine)','Vegetables','100g',100,17.0,1.2,3.3,0.3,2.1,14.0,33.0,0.9,0.2,'Mg:14mg Ca:33mg Fe:0.9mg Zn:0.2mg VitC:4mg'),
('Arugula','Vegetables','100g',100,25.0,2.6,3.7,0.7,1.6,47.0,160.0,1.5,0.5,'Mg:47mg Ca:160mg Fe:1.5mg Zn:0.5mg'),
('Banana','Fruits','piece',118.0,105.0,1.3,27.0,0.4,3.1,32.0,6.0,0.3,0.2,'Mg:32mg Ca:6mg Fe:0.3mg Zn:0.2mg B6:0.4mg'),
('Apple','Fruits','piece',182.0,95.0,0.5,25.0,0.3,4.4,9.0,11.0,0.2,0.1,'Mg:9mg Ca:11mg Fe:0.2mg Zn:0.1mg VitC:8mg'),
('Orange','Fruits','piece',131.0,62.0,1.2,15.0,0.2,3.1,13.0,52.0,0.1,0.1,'Mg:13mg Ca:52mg Fe:0.1mg Zn:0.1mg VitC:70mg'),
('Mango','Fruits','100g',100,60.0,0.8,15.0,0.4,1.6,10.0,11.0,0.2,0.1,'Mg:10mg Ca:11mg Fe:0.2mg Zn:0.1mg VitA:54µg VitC:36mg'),
('Strawberry','Fruits','100g',100,32.0,0.7,7.7,0.3,2.0,13.0,16.0,0.4,0.1,'Mg:13mg Ca:16mg Fe:0.4mg Zn:0.1mg VitC:59mg'),
('Blueberry','Fruits','100g',100,57.0,0.7,14.0,0.3,2.4,6.0,6.0,0.3,0.2,'Mg:6mg Ca:6mg Fe:0.3mg Zn:0.2mg VitC:10mg'),
('Pineapple','Fruits','100g',100,50.0,0.5,13.0,0.1,1.4,12.0,13.0,0.3,0.1,'Mg:12mg Ca:13mg Fe:0.3mg Zn:0.1mg VitC:48mg'),
('Watermelon','Fruits','100g',100,30.0,0.6,7.6,0.2,0.4,10.0,7.0,0.2,0.1,'Mg:10mg Ca:7mg Fe:0.2mg Zn:0.1mg VitC:8mg'),
('Grapes','Fruits','100g',100,69.0,0.7,18.0,0.2,0.9,7.0,10.0,0.4,0.1,'Mg:7mg Ca:10mg Fe:0.4mg Zn:0.1mg'),
('Kiwi','Fruits','piece',76.0,46.0,0.9,11.0,0.4,2.1,12.0,23.0,0.2,0.1,'Mg:12mg Ca:23mg Fe:0.2mg Zn:0.1mg VitC:71mg'),
('Peach','Fruits','piece',150.0,59.0,1.4,14.0,0.4,2.3,12.0,9.0,0.4,0.3,'Mg:12mg Ca:9mg Fe:0.4mg Zn:0.3mg VitA:16µg'),
('Pear','Fruits','piece',178.0,101.0,0.6,27.0,0.2,5.5,12.0,16.0,0.3,0.2,'Mg:12mg Ca:16mg Fe:0.3mg Zn:0.2mg'),
('Avocado','Fruits','100g',100,160.0,2.0,9.0,15.0,6.7,29.0,12.0,0.6,0.6,'Mg:29mg Ca:12mg Fe:0.6mg Zn:0.6mg K:485mg'),
('Date (Medjool)','Fruits','piece',24.0,66.0,0.4,18.0,0.04,1.6,13.0,15.0,0.25,0.1,'Mg:13mg Ca:15mg Fe:0.25mg Zn:0.1mg K:167mg'),
('Fig (fresh)','Fruits','piece',50.0,37.0,0.4,9.6,0.1,1.5,8.0,18.0,0.2,0.1,'Mg:8mg Ca:18mg Fe:0.2mg Zn:0.1mg'),
('Pomegranate','Fruits','100g',100,83.0,1.7,19.0,1.2,4.0,12.0,10.0,0.3,0.4,'Mg:12mg Ca:10mg Fe:0.3mg Zn:0.4mg VitC:10mg'),
('Lemon','Fruits','piece',58.0,17.0,0.6,5.4,0.2,1.6,5.0,15.0,0.3,0,'Mg:5mg Ca:15mg Fe:0.3mg VitC:31mg'),
('Cherry','Fruits','100g',100,63.0,1.1,16.0,0.2,2.1,11.0,13.0,0.4,0.1,'Mg:11mg Ca:13mg Fe:0.4mg Zn:0.1mg VitC:7mg'),
('Papaya','Fruits','100g',100,43.0,0.5,11.0,0.3,1.7,21.0,20.0,0.3,0.1,'Mg:21mg Ca:20mg Fe:0.3mg Zn:0.1mg VitC:62mg VitA:47µg'),
('Guava','Fruits','100g',100,68.0,2.6,14.0,1.0,5.4,22.0,18.0,0.3,0.2,'Mg:22mg Ca:18mg Fe:0.3mg Zn:0.2mg VitC:228mg'),
('Coconut (fresh)','Fruits','100g',100,354.0,3.3,15.0,33.0,9.0,32.0,14.0,2.4,1.1,'Mg:32mg Ca:14mg Fe:2.4mg Zn:1.1mg'),
('Olive oil (extra virgin)','Oils & Fats','tbsp',14.0,119.0,0.0,0.0,14.0,0.0,0,0,0,0,'VitE:1.9mg · Anti-inflammatory · Omega9:9.8g'),
('Coconut oil','Oils & Fats','tbsp',14.0,121.0,0.0,0.0,14.0,0.0,0,0,0,0,'Saturated:13g · MCT:6g · Fast energy'),
('Avocado oil','Oils & Fats','tbsp',14.0,124.0,0.0,0.0,14.0,0.0,0,0,0,0,'VitE:1.3mg · Omega9:9.9g · High smoke point'),
('Sunflower oil','Oils & Fats','tbsp',14.0,124.0,0.0,0.0,14.0,0.0,0,0,0,0,'VitE:5.6mg · Omega6:8.9g'),
('Flaxseed oil','Oils & Fats','tbsp',14.0,120.0,0.0,0.0,14.0,0.0,0,0,0,0,'Omega3:7.3g · Best plant Omega-3 oil'),
('Ghee','Oils & Fats','tbsp',14.0,123.0,0.0,0.0,14.0,0.0,0,0,0,0,'Saturated:9g · VitA:438IU · Lactose-free'),
('Honey','Natural Sweeteners','tbsp',21.0,64.0,0.1,17.0,0.0,0.0,0.1,1.0,0.1,0,'Mg:0.1mg Ca:1mg Fe:0.1mg · Antioxidants'),
('Dates (dried)','Natural Sweeteners','100g',100,282.0,2.5,75.0,0.4,8.0,54.0,64.0,1.02,0.4,'Mg:54mg Ca:64mg Fe:1.02mg Zn:0.4mg K:696mg'),
('Molasses (blackstrap)','Natural Sweeteners','tbsp',20.0,47.0,0.0,12.0,0.0,0.0,48.0,200.0,3.5,0.3,'Mg:48mg Ca:200mg Fe:3.5mg Zn:0.3mg K:498mg'),
('Whey protein powder','Protein Supplements','scoop',30.0,113.0,22.0,3.0,1.5,0.0,0,100.0,0,0,'Ca:100mg · Fast-absorbing · Best post-workout'),
('Casein protein powder','Protein Supplements','scoop',33.0,120.0,24.0,4.0,1.0,1.0,0,400.0,0,0,'Ca:400mg · Slow-digesting · Ideal before bed'),
('Pea protein powder','Protein Supplements','scoop',30.0,110.0,20.0,2.0,2.0,1.0,0,0,5.0,0,'Fe:5mg · Plant-based · Good amino profile'),
('Hemp protein powder','Protein Supplements','scoop',30.0,113.0,14.0,9.0,4.0,7.0,140.0,0,0,0,'Mg:140mg · Omega3:2.5g · Full spectrum EFA'),
('Brown rice protein powder','Protein Supplements','scoop',30.0,110.0,22.0,3.0,2.0,1.0,0,0,0,0,'Good for plant-based athletes'),
('Turmeric','Herbs & Spices','tsp',3.0,9.0,0.3,2.0,0.3,0.7,0,0,0.9,0,'Fe:0.9mg · Curcumin: anti-inflammatory'),
('Ginger (fresh)','Herbs & Spices','100g',100,80.0,1.8,18.0,0.8,2.0,43.0,16.0,0.6,0,'Mg:43mg Ca:16mg Fe:0.6mg · Anti-nausea'),
('Black pepper','Herbs & Spices','tsp',2.3,6.0,0.2,1.5,0.1,0.6,0,0,0,0,'Enhances curcumin absorption by 2000%'),
('Cinnamon','Herbs & Spices','tsp',2.6,6.0,0.1,2.0,0.0,1.4,1.5,26.0,0,0,'Mg:1.5mg Ca:26mg · Blood sugar regulation'),
('Cumin seeds','Herbs & Spices','tsp',2.0,8.0,0.4,0.9,0.5,0.2,8.0,0,1.4,0,'Fe:1.4mg Mg:8mg · Digestion support');
