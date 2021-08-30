ALTER TABLE `posts`
ADD author_id int;

ALTER TABLE `sign_ups`
ADD confirmed BOOLEAN DEFAULT true;

ALTER TABLE `sign_ups`
ADD blocked BOOLEAN DEFAULT false;

-- To add FK to users table

-- Bridge table tests <--> classes
CREATE TABLE test_class (
    id_test INT NOT NULL, 
    id_class INT NOT NULL,
    PRIMARY KEY (id_test,id_class),
    FOREIGN KEY (id_test) REFERENCES tests(id),
    FOREIGN KEY (id_class) REFERENCES classes(id)
);