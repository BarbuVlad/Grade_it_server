CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT, 
    email VARCHAR(60) NOT NULL,
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (email)
);

CREATE TABLE classes (
    id INT NOT NULL AUTO_INCREMENT, 
    id_owner INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    PRIMARY KEY (id),
    FOREIGN KEY (id_owner) REFERENCES users(id)
);

-- Bridge table users <--> classes
CREATE TABLE sign_ups (
    id_user INT NOT NULL, 
    id_class INT NOT NULL,
    role ENUM('student','teacher'),
    PRIMARY KEY (id_user,id_class),
    FOREIGN KEY (id_user) REFERENCES users(id),
    FOREIGN KEY (id_class) REFERENCES classes(id)
);

CREATE TABLE posts (
    date_time VARCHAR(30) NOT NULL,
    id_class INT, 
    author VARCHAR,
    title VARCHAR(35),
    body VARCHAR,
    PRIMARY KEY (date_time, id_class),
    FOREIGN KEY (id_class) REFERENCES classes(id)
);

-- Tests tables

CREATE TABLE tests (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(30),
    description VARCHAR(255),
    max_points INT,
    PRIMARY KEY (id)
);

-- Bridge table users <--> tests
CREATE TABLE test_owner (
    id_user INT NOT NULL,
    id_test INT NOT NULL,
    PRIMARY KEY (id_user, id_test),
    FOREIGN KEY (id_user) REFERENCES users(id),
    FOREIGN KEY (id_test) REFERENCES tests(id)
);

-- Answers send by student
CREATE TABLE answers (
    id_user INT NOT NULL,
    id_test INT NOT NULL,
    date_time VARCHAR(30),
    answers TEXT, 
    PRIMARY KEY (id_test, id_user),
    FOREIGN KEY (id_test) REFERENCES tests(id)
);

-- Results created by teacher/system for the answers provided
CREATE TABLE results (
    id_user INT NOT NULL,
    id_test INT NOT NULL,
    teacher VARCHAR(50),
    date_time VARCHAR(30),
    results TEXT, 
    PRIMARY KEY (id_test, id_user)
   -- FOREIGN KEY (id_test) REFERENCES answers(id_test)
);

CREATE TABLE schedules (
    id_class INT NOT NULL,
    id_test INT NOT NULL,
    date_time_start VARCHAR(30) NOT NULL,
    date_time_end VARCHAR(30) NOT NULL,
    PRIMARY KEY (id_class, id_test)
);

-- Obsolete, altered  into tests
CREATE TABLE questions (
    id INT NOT NULL AUTO_INCREMENT,
    id_test INT NOT NULL,
    points INT,  
    question VARCHAR(999) NOT NULL,
    right_answer VARCHAR(999),
    max_points INT,
    PRIMARY KEY (id)
);

-- Some alter tables:
ALTER TABLE `posts` 
CHANGE body body VARCHAR(2000);

ALTER TABLE `posts` 
CHANGE author author VARCHAR(50);

ALTER TABLE `tests`
ADD questions TEXT;


--|---------------------------------------------


INSERT INTO `users`(email, password) VALUES("mock_user","mock_user");
INSERT INTO `users`(email, password) VALUES("mock_user2","mock_user2");

INSERT INTO `classes`(id_owner, name, description) VALUES(1,"mock_class","mock_class");

-- student sign up
INSERT INTO `sign_ups`(id_user, id_class, role) VALUES(2,3,"student");

INSERT INTO `posts`(id_class, date_time, author, title, body) VALUES(0,"yyyy-mm-dd-hh-mm-ss","author_name_mock", "mock_title", "mock_body_text");

INSERT INTO `tests`(name, description, max_points, questions) VALUES("mock_name_test", "mock_description_test", 100, "mock_questions_json: {...}");

INSERT INTO `test_owner`(id_user, id_test) VALUES(2,1);

INSERT INTO `answers`(id_user, id_test, date_time, answers) VALUES(0,0,"yyyy-mm-dd-hh-mm-ss", "mock_answers_json: {...}");

INSERT INTO `results`(id_user, id_test, teacher, date_time, results) VALUES(0,0,"mock_teacher_name","yyyy-mm-dd-hh-mm-ss", "mock_results_json: {...}");

INSERT INTO `schedules`(id_class, id_test, date_time_start, date_time_start) VALUES(0,0,"yyyy-mm-dd-hh-mm-ss","yyyy-mm-dd-hh-mm-ss");




