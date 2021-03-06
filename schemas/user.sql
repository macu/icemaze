DROP TABLE IF EXISTS user;
CREATE TABLE user (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	username TINYTEXT NOT NULL,
	fullname TINYTEXT,
	email TINYTEXT,
	auth_hash VARCHAR(60),
	registered DATETIME DEFAULT CURRENT_TIMESTAMP
);
