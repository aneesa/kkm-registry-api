CREATE DATABASE kkm_registry;

create extension if not exists "uuid-ossp";

CREATE TABLE logins(
  user_id uuid PRIMARY KEY DEFAULT
  uuid_generate_v4(),
  user_email VARCHAR(255) NOT NULL,
  user_password VARCHAR(255) NOT NULL,
  user_last_login TIMESTAMP
);

CREATE TABLE users(
  user_id uuid PRIMARY KEY REFERENCES logins,
  user_name VARCHAR(255) NOT NULL
);
