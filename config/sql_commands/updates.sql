ALTER TABLE `posts`
ADD author_id int;

ALTER TABLE `sign_ups`
ADD confirmed BOOLEAN DEFAULT true;

ALTER TABLE `sign_ups`
ADD blocked BOOLEAN DEFAULT false;

-- To add FK to users table