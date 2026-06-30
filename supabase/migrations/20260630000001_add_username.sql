ALTER TABLE profiles ADD COLUMN username text UNIQUE;
ALTER TABLE profiles ADD COLUMN country text;
ALTER TABLE profiles ADD COLUMN state text;
ALTER TABLE profiles ADD COLUMN city text;
