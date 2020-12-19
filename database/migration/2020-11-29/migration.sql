CREATE DATABASE kkm_registry;

create extension if not exists "uuid-ossp";

CREATE TABLE logins(
  user_id uuid PRIMARY KEY DEFAULT
  uuid_generate_v4(),
  user_email VARCHAR(255) UNIQUE NOT NULL,
  user_password VARCHAR(255) NOT NULL,
  user_last_login TIMESTAMP
);

CREATE UNIQUE INDEX idx_logins_on_email_asc ON logins USING btree (user_email ASC);

CREATE TABLE users(
  user_id uuid PRIMARY KEY REFERENCES logins,
  user_name VARCHAR(255) NOT NULL
);
