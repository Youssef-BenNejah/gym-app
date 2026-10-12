# Nutrition & Fitness Tracker — Full App Specification for Lovable

## Overview

Build a complete mobile-first nutrition and fitness tracking app using **React** (frontend) and **Supabase** (backend). The app is designed exclusively for mobile use — every screen, interaction, layout, and touch target must be built mobile-first. Desktop is not the primary target. The app must work flawlessly on iPhone and Android screen sizes (375px–430px wide).

This is a **bright, clean, modern health app**. The visual direction is inspired by the UI reference images provided. Study them carefully before building any UI. The design language is:

- Bright white backgrounds
- A dominant green accent color (approximately `#4CAF50` or `#3E9B47` — pick one and stay consistent)
- Clean, rounded cards with soft shadows
- Large, readable typography
- Minimal visual noise
- Generous whitespace
- Bottom navigation bar (5 tabs max)
- No emojis anywhere in the UI — use **Lucide React icons** exclusively for all iconography
- Never generate or use placeholder images — use real food icons or colored placeholder circles with initials only
- The app must feel like a premium health app, not a prototype

---

## Critical Rules Before Building

1. **Mobile-first is not optional.** Every layout must use a single-column structure. No side-by-side panels unless they are small stat cards. Touch targets must be at least 44px tall.
2. **Never use emojis.** Use Lucide React icons for everything — navigation, actions, status indicators, categories.
3. **Never generate images.** The user will upload their own food images or the app will use icon-based representations. Use colored circular avatars or category icons instead.
4. **Supabase is the only backend.** All data must be persisted to Supabase. No localStorage for user data.
5. **Test everything before delivering.** After building all screens, go through every user flow end to end and verify it works. Fix any broken routes, missing states, or non-functional buttons before the final output.
6. **Bright theme only.** White background, green accent, dark text. No dark mode unless explicitly requested later.
7. **The food database is provided by the user.** The user will upload a markdown file (`halal_nutrition_database.md`) containing 210+ halal foods grouped by category with full nutritional data per 100g. You must parse this file and seed it into Supabase on first load or via a dedicated import step. Never hardcode a short list of foods — the full database must be available.
8. **UI inspiration images are provided by the user.** Study them and match the aesthetic. The images show: clean food listing cards, green hero sections, ingredient chips, quantity selectors, meal plan cards, progress rings, and a bottom navigation bar.

---

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Lucide React icons
- **Backend:** Supabase (Auth, Database, Row Level Security)
- **Charts:** Recharts (for weight evolution graph and nutrition breakdown)
- **Animations:** Framer Motion (for water fill animation and transitions)
- **Routing:** React Router v6

---

## Supabase Schema

Create the following tables with Row Level Security enabled on all of them. Every table that contains user data must have a `user_id` column referencing `auth.users(id)`.

### Table: `profiles`
```
id uuid references auth.users(id) primary key
created_at timestamptz default now()
full_name text
age integer
gender text (male | female)
height_cm integer
current_weight_kg decimal(5,2)
target_weight_kg decimal(5,2)
body_fat_percent decimal(4,1)
target_body_fat_percent decimal(4,1)
activity_level text (sedentary | lightly_active | moderately_active | very_active)
goal text (lose_fat | maintain | gain_muscle)
daily_calorie_target integer
daily_protein_target_g integer
daily_carbs_target_g integer
daily_fat_target_g integer
daily_fiber_target_g integer
daily_water_target_ml integer
```

### Table: `foods`
```
id uuid default gen_random_uuid() primary key
created_at timestamptz default now()
name text not null
category text not null
serving_unit text (100g | piece | tbsp | cup | scoop | ml)
serving_size_g decimal(6,2)
calories_per_serving decimal(6,2)
protein_g decimal(6,2)
carbs_g decimal(6,2)
fat_g decimal(6,2)
fiber_g decimal(6,2)
magnesium_mg decimal(6,2)
calcium_mg decimal(6,2)
iron_mg decimal(6,2)
zinc_mg decimal(6,2)
notes text
is_halal boolean default true
```

### Table: `meals`
```
id uuid default gen_random_uuid() primary key
created_at timestamptz default now()
user_id uuid references auth.users(id)
name text not null
description text
total_calories decimal(7,2)
total_protein_g decimal(6,2)
total_carbs_g decimal(6,2)
total_fat_g decimal(6,2)
total_fiber_g decimal(6,2)
```

### Table: `meal_items`
```
id uuid default gen_random_uuid() primary key
meal_id uuid references meals(id) on delete cascade
food_id uuid references foods(id)
quantity_g decimal(7,2)
calories decimal(7,2)
protein_g decimal(6,2)
carbs_g decimal(6,2)
fat_g decimal(6,2)
fiber_g decimal(6,2)
```

### Table: `daily_logs`
```
id uuid default gen_random_uuid() primary key
user_id uuid references auth.users(id)
log_date date not null
total_calories decimal(7,2) default 0
total_protein_g decimal(6,2) default 0
total_carbs_g decimal(6,2) default 0
total_fat_g decimal(6,2) default 0
total_fiber_g decimal(6,2) default 0
water_consumed_ml integer default 0
notes text
unique(user_id, log_date)
```

### Table: `daily_log_meals`
```
id uuid default gen_random_uuid() primary key
daily_log_id uuid references daily_logs(id) on delete cascade
meal_id uuid references meals(id)
meal_time text (breakfast | morning_snack | lunch | afternoon_snack | dinner)
calories decimal(7,2)
protein_g decimal(6,2)
carbs_g decimal(6,2)
fat_g decimal(6,2)
fiber_g decimal(6,2)
```

### Table: `weight_logs`
```
id uuid default gen_random_uuid() primary key
user_id uuid references auth.users(id)
logged_at date not null
weight_kg decimal(5,2) not null
notes text
unique(user_id, logged_at)
```

### Table: `water_logs`
```
id uuid default gen_random_uuid() primary key
user_id uuid references auth.users(id)
log_date date not null
amount_ml integer not null
logged_at timestamptz default now()
```

---

## App Architecture — Screens & Navigation

The app has a **bottom navigation bar** with 5 tabs using Lucide icons:

1. **Home** (icon: `Home`) — Today's dashboard
2. **Meals** (icon: `UtensilsCrossed`) — Meal library and creator
3. **Log** (icon: `PlusCircle`) — Today's food diary
4. **Progress** (icon: `TrendingUp`) — Weight tracker and charts
5. **Profile** (icon: `User`) — Settings and goals

The active tab must be clearly highlighted with the green accent color. Inactive tabs use a muted gray. The bottom nav must be fixed to the bottom of the screen with safe area insets for iOS home indicator.

---

## Screen 1 — Onboarding / Sign Up

### Purpose
New users fill a multi-step form to set up their profile and nutrition goals before accessing the app.

### Flow
Step-by-step wizard with a progress bar at the top showing steps 1 of 4, 2 of 4, etc. A back button on each step except the first. A "Continue" primary button at the bottom of each step.

### Step 1 — Account creation
- Full name (text input)
- Email (email input)
- Password (password input with show/hide toggle using Lucide `Eye` / `EyeOff`)
- Confirm password
- Supabase `auth.signUp()` is called only when the user reaches the final step and taps "Create Account"

### Step 2 — Body measurements
Title: "Tell us about your body"
- Age (number input, stepper with + and - buttons)
- Gender (segmented selector: Male / Female)
- Height in cm (number input with slider, range 140–220)
- Current weight in kg (number input with slider, range 40–200, step 0.5)
- Current body fat % (number input, range 5–50, optional)

### Step 3 — Goal setting
Title: "What is your goal?"
Three large cards, tap to select one (radio-style selection with green border on selected):
- **Lose body fat** — "Reduce fat mass while preserving muscle" — icon: `TrendingDown`
- **Maintain weight** — "Keep current weight, improve body composition" — icon: `Minus`
- **Gain muscle** — "Build lean mass with a calorie surplus" — icon: `TrendingUp`

Then:
- Target weight in kg (number input)
- Target body fat % (optional, number input)
- Activity level (dropdown): Sedentary / Lightly active / Moderately active / Very active

### Step 4 — Nutrition targets
Title: "Your daily nutrition targets"

Show auto-calculated values based on what they entered. Display as large editable cards. The user can accept the calculated values or override them by tapping the value to edit.

**Calculation logic:**
- BMR (Mifflin-St Jeor):
  - Male: `(10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5`
  - Female: `(10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161`
- TDEE = BMR × activity multiplier (sedentary 1.2 / lightly active 1.375 / moderately active 1.55 / very active 1.725)
- Calorie target:
  - Lose fat: TDEE − 500
  - Maintain: TDEE
  - Gain muscle: TDEE + 300
- Protein: 2.2g × lean body mass kg (lean mass = weight × (1 − bodyfat/100), default to 1.8g × weight if no body fat provided)
- Fat: 0.8g × weight_kg
- Carbs: (remaining calories after protein and fat) / 4
- Fiber: 30g for women, 38g for men
- Water: 35ml × weight_kg

Display each target in a card:
- Calories (kcal) — editable
- Protein (g) — editable
- Carbs (g) — editable
- Fat (g) — editable
- Fiber (g) — editable
- Water (ml) — editable

Big "Create My Account" button at the bottom. On tap: create Supabase auth user, insert profile row, navigate to Home.

---

## Screen 2 — Login

Simple, clean screen:
- App logo + name at top
- "Welcome back" heading
- Email input
- Password input with show/hide
- "Forgot password?" link (sends Supabase reset email)
- "Sign in" primary green button
- "Don't have an account? Sign up" link at bottom

On successful login, navigate to Home tab. On error, show inline error message below the relevant field.

---

## Screen 3 — Home (Today's Dashboard)

### Header
- "Good morning, [first name]" with today's date (e.g. "Monday, July 27")
- Bell icon for notifications (non-functional for now, just present)

### Calorie ring card
A large circular progress ring (use SVG, not a library) showing:
- Center: `1,420 / 2,100 kcal` (calories consumed vs target)
- Below center: `680 kcal remaining`
- The ring fills clockwise in green as calories are consumed
- If over target, the overflow portion fills in red

Below the ring, four small macro stat pills in a row:
- Protein: `120g / 175g`
- Carbs: `140g / 200g`
- Fat: `45g / 65g`
- Fiber: `18g / 35g`

Each pill has a thin colored progress bar underneath it. Colors: protein = blue, carbs = amber, fat = green, fiber = pink.

### Water card
A compact card below the macro pills:
- Title: "Water" with a `Droplets` icon
- Progress: `1,400 / 3,290 ml` 
- A horizontal fill bar in light blue
- Quick-add buttons: `+250ml` `+500ml` `+750ml` — tapping one adds that amount to today's water log instantly

### Today's meals preview
A section titled "Today's meals" with a "See all" link that goes to the Log tab.
Show up to 3 of today's logged meal slots:
- Breakfast
- Lunch  
- Dinner

Each slot is a card with:
- Meal time label and icon (`Sunrise`, `Sun`, `Moon`)
- Meal name if logged, "Tap to add" if not
- Calories shown on the right
- A small `+` icon button to add a meal to that slot

### Weight reminder card
Every Monday morning, show a banner card: "Time to weigh yourself — log your weight for this week." With a "Log weight" button that opens the weight log modal. Dismiss (X) button to hide for the day.

---

## Screen 4 — Meals Library (Meals Tab)

### Purpose
The user browses their saved meals, creates new ones, and views nutritional breakdown.

### Header
- Title: "My Meals"
- Search bar with `Search` icon (filters meal cards in real time)
- `+` button (Lucide `Plus` icon) to create a new meal

### Meal cards
Each meal displays as a card:
- Meal name (bold, 16px)
- Total calories (right-aligned, green accent)
- Macro row: P · C · F in small muted text
- Number of ingredients
- Tap card to open meal detail
- Long press or swipe left to reveal delete option

### Empty state
If no meals created yet: centered illustration using a Lucide `UtensilsCrossed` icon at 64px, text "No meals yet", subtext "Create your first meal to start tracking", and a green "Create meal" button.

---

## Screen 4a — Create Meal (Full Screen Modal)

### Purpose
User builds a custom meal by selecting foods from the halal food database and specifying quantities.

### Layout
Full-screen modal (slides up from bottom) with:
- "X" close button top left
- "Save meal" button top right (disabled until meal has a name and at least one food)
- Meal name input at top: large text input, placeholder "e.g. Post-workout protein bowl"
- Optional description input

### Food search section
Below the meal name:
- A search bar: "Search from 210+ halal foods..."
- Category filter chips below the search bar (scrollable horizontally): All · Meat & Poultry · Fish & Seafood · Eggs & Dairy · Grains · Legumes · Nuts & Seeds · Vegetables · Fruits · Oils · Supplements · Herbs
- Tapping a category filters the food list below

### Food list
Scrollable list of food cards matching search/filter:
- Food name
- Category badge
- Nutritional info per 100g: `Cal · P · C · F` in small text
- `+` button on the right to add the food to the meal

When `+` is tapped, a **quantity input bottom sheet** slides up:
- Food name as title
- Serving size input: number field + unit selector (g, ml, piece, tbsp, cup, scoop)
- Live calculation: as the user types the quantity, show the resulting nutritional values updating in real time
  - e.g. "200g of Chicken Breast = 330 kcal · 62g protein · 0g carbs · 7.2g fat"
- "Add to meal" green button

### Meal summary (sticky bottom bar)
A sticky summary bar at the bottom (above keyboard) shows the running totals of the meal:
- Total kcal | P: Xg | C: Xg | F: Xg | Fiber: Xg
- Updates in real time as the user adds/removes items

### Added ingredients list
Between the food search and the sticky bar, show the list of foods already added to this meal:
- Food name + quantity
- Calculated calories
- Swipe left or tap trash icon to remove
- Tap to edit quantity

### Save logic
When "Save meal" is tapped:
- Validate: meal has a name, has at least 1 food item
- Insert meal into `meals` table
- Insert all food items into `meal_items` table
- Close modal and refresh meals list

---

## Screen 5 — Daily Food Log (Log Tab)

### Purpose
The user logs what they ate today by selecting from their created meals.

### Header
- Date selector: left/right arrows to navigate days, center shows "Today" or date
- Tapping the date opens a calendar picker

### Daily nutrition summary
At the top, a compact summary bar:
- Calories: consumed vs target (e.g. `1,420 / 2,100 kcal`)
- A thin horizontal progress bar below

### Meal slots
Five collapsible sections:
1. Breakfast (icon: `Sunrise`)
2. Morning snack (icon: `Coffee`)
3. Lunch (icon: `Sun`)
4. Afternoon snack (icon: `Cookie`)
5. Dinner (icon: `Moon`)

Each section shows:
- Section header with meal time, icon, and total calories for that slot
- List of meals added to that slot (meal name + calories)
- "+ Add meal" button at the bottom of each section

### Adding a meal to a slot
When "+ Add meal" is tapped:
- A bottom sheet slides up showing the user's saved meals list
- Search bar at the top
- Each meal card shows name + calories
- Tap to add — this creates a `daily_log_meals` entry and updates `daily_logs` totals

### Removing a meal from a slot
Swipe left on the meal item to reveal a red delete button.

### Daily nutrition breakdown
At the bottom of the log screen, a card showing:
- Circular ring for calories (same style as home screen)
- Bar chart (horizontal) for each macro vs target
- Macros: Protein, Carbs, Fat, Fiber — each with current/target and a colored bar
- Green if under target, red if over target

### Daily notes
A text area at the bottom: "Add a note about today..." — saved to `daily_logs.notes`

---

## Screen 6 — Weight Tracker (Progress Tab)

### Header
- Title: "Weight Progress"
- `+` icon button to log weight

### Log weight modal
A bottom sheet modal:
- Title: "Log your weight"
- Subtitle: "For best results, weigh yourself every Monday morning before eating"
- Date field (defaults to today, user can change)
- Weight input in kg (large number input with +/- stepper, step 0.1)
- Optional notes field
- "Save" green button

### Weight chart
A line chart built with Recharts:
- X axis: dates (show every logged entry)
- Y axis: weight in kg
- A horizontal dashed line showing the target weight in a different color (e.g. amber)
- Smooth curve interpolation
- Dots on each data point — tap a dot to show a tooltip with date and weight
- Chart background: white
- Grid lines: very light gray
- The actual weight line: green
- Target weight line: dashed amber

### Stats row below chart
Four stat cards in a 2×2 grid:
- Starting weight: `94.0 kg`
- Current weight: `91.5 kg` (most recent entry)
- Lost so far: `−2.5 kg` (green if negative, red if positive for lose_fat goal)
- Goal: `83.0 kg`

### Weight log history
A scrollable list below the stats, most recent first:
- Each entry: date on left, weight on right, optional note below
- Swipe left to delete an entry (with confirmation dialog)
- Format: "Monday, July 14 · 91.5 kg"

### BMI card
A card showing:
- Current BMI calculated from height and current weight
- BMI category label (Underweight / Normal / Overweight / Obese) with appropriate color
- Formula used: weight(kg) / (height(m) × height(m))

---

## Screen 7 — Water Tracker (embedded in Home + detail view)

The water tracker is accessible from the Home screen quick-add buttons and from a dedicated detail view accessible by tapping the water card on Home.

### Water detail screen
- Full page view
- Title: "Daily Hydration"
- Target: `3,290 ml` for the day

### Water fill animation
A large centered graphic:
- An outlined human body silhouette (built with SVG, not an image) OR a large cup/bottle outline (SVG)
- The fill level animates upward from 0% to the current percentage as the page loads
- Fill color: light blue (`#60A5FA` or similar)
- The percentage is shown centered inside: `42%`
- Below: `1,380 / 3,290 ml consumed`

### Quick add buttons
Four large buttons in a 2×2 grid:
- `+150 ml` (small glass)
- `+250 ml` (medium glass)
- `+500 ml` (bottle)
- `+750 ml` (large bottle)

Tapping any button:
- Inserts a row into `water_logs`
- Animates the fill level up
- Updates the progress number

### Custom amount
A "Custom amount" button below the grid that opens a number input to type any amount in ml.

### Today's log
A timeline list at the bottom showing all water entries for today:
- Time logged
- Amount
- Running total at that point
- Swipe left to delete an entry

---

## Screen 8 — Profile & Settings

### User card
At the top:
- Avatar circle (initials from full name, green background)
- Full name
- Email
- Member since date

### Goal summary card
- Goal type badge (e.g. "Lose body fat")
- Current → Target: `94 kg → 83 kg`
- Progress bar showing how far they are

### Daily targets section
Title: "My Daily Targets"
Editable list of all targets. Tapping any row opens an inline edit:
- Calories
- Protein
- Carbs
- Fat
- Fiber
- Water

Each has a pencil icon (`Pencil`) to edit. Changes save immediately to Supabase on blur.

### Body measurements section
Title: "My Measurements"
Same editable list pattern:
- Height
- Current weight
- Body fat %
- Age
- Gender

### Account section
- Change password (opens Supabase password reset flow)
- Sign out (clears session, navigates to Login)

---

## Food Database Import

**This is critical.** The user will upload a markdown file (`halal_nutrition_database.md`) containing 210+ halal foods with full nutritional data. You must build an import mechanism:

### Import logic
Build a utility function `importFoodsFromMarkdown(markdownText: string)` that:
1. Parses the markdown tables
2. Extracts: food name, category, serving size, calories, protein, carbs, fat, fiber, and micronutrient notes
3. Maps each food to the `foods` table schema
4. Runs an `upsert` (insert or update on conflict of name + category) to Supabase

### When to run import
- The import should run once automatically when a user first signs up (or when the foods table is empty)
- There must also be a manual "Refresh food database" button in the Profile screen under an "Admin" section (only shown when `foods` table is empty or user triggers it)
- Do not re-import if foods already exist in the database

### Parsing notes
The markdown file uses tables in this format:
```
| Food name | Per | Cal | P (g) | C (g) | F (g) | Fi (g) | Micronutrients |
```
Parse each row: skip the header row and separator row. Map columns to the food schema. For the "per" column: if it says "100g" set `serving_unit = '100g'` and `serving_size_g = 100`. If it says "1 egg (50g)" extract the gram value in parentheses. If it says "1 tbsp (14g)" do the same.

The category is inferred from the markdown section heading (e.g. `## 🥩 Meat & Poultry` → category = `Meat & Poultry`, strip the emoji).

---

## Nutrition Calculation Engine

Build a `nutritionCalculator.ts` utility with these functions:

### `calculateFoodNutrition(food, quantityG)`
Given a food item from the database and a quantity in grams, return:
```typescript
{
  calories: number,
  protein_g: number,
  carbs_g: number,
  fat_g: number,
  fiber_g: number
}
```
Formula: `(nutrient_per_serving / serving_size_g) × quantityG`

### `calculateMealNutrition(mealItems)`
Sum up all `calculateFoodNutrition` results for each item in the meal.

### `calculateDayNutrition(dailyLogMeals)`
Sum up all meal nutrition values for the day.

### `compareToTarget(actual, target)`
Returns an object with: `calories_percent`, `protein_percent`, `carbs_percent`, `fat_percent`, `fiber_percent` — the percentage of each target achieved. Also returns `status` for each: `under` (< 80%) | `on_track` (80–110%) | `over` (> 110%).

---

## UI Design System

### Colors
```
Primary green: #3E9B47
Light green (background tints): #F0FAF1
Dark green (text on green): #1E5922
Amber (warnings, target line): #F59E0B
Blue (protein color): #3B82F6
Orange/Amber (carbs color): #F59E0B
Green (fat color): #10B981
Pink (fiber color): #EC4899
Water blue: #60A5FA
Background: #FFFFFF
Surface (cards): #F9FAFB
Border: #E5E7EB
Text primary: #111827
Text secondary: #6B7280
Text muted: #9CA3AF
Danger/Red: #EF4444
```

### Typography
- Font: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- H1: 24px, font-weight 700
- H2: 20px, font-weight 600
- H3: 16px, font-weight 600
- Body: 14px, font-weight 400
- Caption: 12px, font-weight 400, color text-muted
- Labels/Badges: 11px, font-weight 500

### Spacing
- Base unit: 4px
- Card padding: 16px
- Screen horizontal padding: 16px
- Card gap: 12px
- Section gap: 24px

### Cards
- Background: white
- Border: 1px solid `#E5E7EB`
- Border radius: 16px
- Shadow: `0 1px 3px rgba(0,0,0,0.08)`

### Buttons
- Primary: Background `#3E9B47`, text white, border-radius 12px, height 52px, font-weight 600
- Secondary: Background white, border 1.5px solid `#3E9B47`, text `#3E9B47`, same sizing
- Destructive: Background `#EF4444`, text white
- Ghost: No background, no border, text `#6B7280`
- Icon button: 44×44px minimum, border-radius 12px

### Inputs
- Height: 52px
- Border: 1.5px solid `#E5E7EB`
- Border-radius: 12px
- Focus border: `#3E9B47`
- Background: white
- Padding: 0 16px
- Font size: 15px

### Bottom navigation bar
- Height: 64px + safe area inset
- Background: white
- Top border: 1px solid `#E5E7EB`
- Icon size: 24px
- Label size: 10px
- Active color: `#3E9B47`
- Inactive color: `#9CA3AF`

### Progress rings (SVG)
- Stroke width: 8px
- Background ring: `#E5E7EB`
- Fill ring: green (or color by macro)
- Rounded linecap
- Animate fill on mount with a 1 second ease-out

### Macro bar (horizontal progress)
- Height: 6px
- Background: `#E5E7EB`
- Filled portion: color per macro (blue/amber/green/pink)
- Border-radius: 99px
- Animate width on mount

---

## Animation Guidelines

Use Framer Motion for:
- Page transitions: slide in from right on navigate forward, slide from left on go back
- Bottom sheet modals: slide up from bottom, fade backdrop
- Cards on first load: fade in + slight upward translate (stagger each card 50ms apart)
- Water fill animation: animate the SVG fill height from current to new value over 600ms ease-out
- Calorie ring: animate the stroke-dashoffset on mount over 1 second
- Number counters: when a number updates (e.g. after adding water), animate the digits changing

Do NOT add animations that slow down the experience. Keep animations under 400ms for interactive responses and under 1 second for page-level reveals.

---

## Error Handling & Loading States

- Every screen that fetches data must show a skeleton loading state while data is loading (not a spinner, use skeleton cards that match the real card dimensions)
- Every form submission must show a loading state on the button (spinner icon replacing the label) while the request is in flight
- All Supabase errors must be caught and displayed as a toast notification (bottom of screen, above nav bar, auto-dismiss after 4 seconds)
- If a user is not authenticated and tries to access any tab, redirect to Login screen
- If the profile is incomplete (no targets set), redirect to Onboarding

---

## Testing Checklist (run through all of these before delivering)

Go through every item below and confirm it works. Fix anything that fails.

**Auth flows**
- [ ] Sign up with new email — all 4 steps work, account is created, profile is saved
- [ ] Login with correct credentials — navigates to Home
- [ ] Login with wrong password — shows error message
- [ ] Forgot password — sends email (Supabase handles)
- [ ] Sign out — clears session, returns to Login

**Food database**
- [ ] Foods are imported from the markdown file into Supabase on first use
- [ ] 200+ foods appear in the meal creator search
- [ ] Category filter chips work correctly
- [ ] Search filters foods by name in real time

**Meal creation**
- [ ] Create a meal with a name and 3 ingredients
- [ ] Quantity input calculates nutrition correctly
- [ ] Meal total nutrition updates in real time as items are added
- [ ] Meal saves to Supabase
- [ ] Meal appears in the meals library
- [ ] Delete a meal — removes from library

**Daily log**
- [ ] Add a meal to Breakfast slot for today
- [ ] Add a meal to Dinner slot
- [ ] Daily calorie total updates correctly
- [ ] Navigate to yesterday — shows empty log
- [ ] Remove a meal from a slot — totals update

**Water tracker**
- [ ] Tap +250ml on Home — water count increases
- [ ] Open water detail screen — fill animation plays
- [ ] Add custom amount — updates correctly
- [ ] Total water saved to Supabase

**Weight tracker**
- [ ] Log first weight entry
- [ ] Log a second weight entry on a different date
- [ ] Chart renders with both points connected
- [ ] Target weight line appears
- [ ] Delete a weight entry — chart updates

**Profile**
- [ ] Edit calorie target — saves immediately
- [ ] Edit protein target — saves immediately
- [ ] Avatar shows correct initials
- [ ] Sign out works

**Navigation**
- [ ] All 5 bottom tabs navigate to correct screens
- [ ] Back navigation works on all sub-screens
- [ ] Bottom sheet modals open and close correctly
- [ ] Keyboard does not cover inputs on mobile

---

## Important Notes for Lovable

1. **The user will upload two files** alongside this prompt:
   - `halal_nutrition_database.md` — the food database to import
   - Three UI inspiration images showing the visual design direction

2. **Study the UI images carefully.** Match: the card styles, the green hero section at the top of product detail pages, the ingredient chip row, the quantity selector with minus/plus buttons, the bottom navigation bar layout, the clean white card grid for food listings.

3. **Never use placeholder food images.** Use colored category icons (Lucide icons) inside a colored circle instead. For example, meat category: a fork icon in a green circle. Fish category: a fish icon. Vegetables: a leaf icon.

4. **The app must work on mobile screen widths from 375px to 430px.** Test all layouts at 390px width (iPhone 14 size).

5. **All numbers must be rounded** to 1 decimal place maximum. No floating point artifacts like `7.000000001`.

6. **Date formatting:** Always show dates in a human-readable format. Use `date-fns` for all date operations. Today = "Today", yesterday = "Yesterday", older = "Mon, Jul 14".

7. **The calorie and nutrition targets from the profile must be used everywhere** — on the Home ring, on the Log screen comparison bars, on the Profile display. They must come from the `profiles` table, not be hardcoded.

8. **Supabase Row Level Security** must be properly set up so users can only read and write their own data.

9. Build the app in this order to avoid dependency issues:
   1. Supabase schema and RLS
   2. Auth screens (Login, Sign up)
   3. Onboarding wizard
   4. Food database import utility
   5. Home dashboard (static first, then real data)
   6. Meal creator
   7. Daily log
   8. Water tracker
   9. Weight tracker
   10. Profile screen
   11. Connect all real data
   12. Run through the full testing checklist
   13. Fix all bugs
   14. Deliver
