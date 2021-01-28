CREATE DATABASE kkm_registry;

create extension if not exists "uuid-ossp";

-- user_role: user, admin
CREATE TABLE logins(
  user_id uuid PRIMARY KEY DEFAULT
  uuid_generate_v4(),
  user_email VARCHAR(255) UNIQUE NOT NULL,
  user_password VARCHAR(255) NOT NULL,
  user_role VARCHAR(255) DEFAULT 'user' NOT NULL,
  user_last_login TIMESTAMP
);

CREATE UNIQUE INDEX idx_logins_on_email_asc ON logins USING btree (user_email ASC);

CREATE TABLE users(
  user_id uuid PRIMARY KEY REFERENCES logins,
  user_name VARCHAR(255) NOT NULL,
  user_phone_no VARCHAR(255),
  user_home_address VARCHAR(255)
);

-- status: request, approve, reject
CREATE TABLE memberships(
  user_id uuid PRIMARY KEY REFERENCES logins,
  user_membership_no VARCHAR(255),
  status VARCHAR(255) DEFAULT 'request' NOT NULL,
  requested_on TIMESTAMP NOT NULL,
  responded_by uuid REFERENCES logins,
  responded_on TIMESTAMP,
  reason VARCHAR(255)
)

-- test users: test+n@test.com/PassWord123!
