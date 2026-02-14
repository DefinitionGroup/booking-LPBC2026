-- Enable RLS policies for seeding data (Developers/Admins)

-- Companies
create policy "Enable insert for authenticated users" on companies 
for insert with check (auth.role() = 'authenticated');

-- Buildings
create policy "Enable insert for authenticated users" on buildings 
for insert with check (auth.role() = 'authenticated');

-- Floors
create policy "Enable insert for authenticated users" on floors 
for insert with check (auth.role() = 'authenticated');

-- Rooms
create policy "Enable insert for authenticated users" on rooms 
for insert with check (auth.role() = 'authenticated');
