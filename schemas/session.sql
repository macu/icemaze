DROP TABLE IF EXISTS session;
CREATE TABLE session (
	token VARCHAR(30) PRIMARY KEY,
	user_id INT UNSIGNED NOT NULL,
	expires DATETIME NOT NULL,
	FOREIGN KEY (user_id) REFERENCES user(id)
);