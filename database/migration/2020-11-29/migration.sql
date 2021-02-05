CREATE DATABASE kkm_registry;

create extension if not exists "uuid-ossp";

-- test users: test+n@test.com/PassWord123!
-- user_role: user, admin
CREATE TABLE logins(
  user_id uuid PRIMARY KEY DEFAULT
  uuid_generate_v4(),
  user_email VARCHAR(255) UNIQUE NOT NULL,
  user_password VARCHAR(255) NOT NULL,
  user_role VARCHAR(255) DEFAULT 'user' NOT NULL,
  user_last_login TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_logins_on_email_asc ON logins USING btree (user_email ASC);

CREATE TABLE users(
  user_id uuid PRIMARY KEY REFERENCES logins,
  user_name VARCHAR(255) NOT NULL,
  user_phone_no VARCHAR(255),
  user_home_address VARCHAR(255)
);

-- status: requested, approved, rejected
CREATE TABLE memberships(
  user_id uuid PRIMARY KEY REFERENCES logins,
  user_membership_no VARCHAR(255),
  status VARCHAR(255) DEFAULT 'requested' NOT NULL,
  requested_on TIMESTAMPTZ DEFAULT now(),
  responded_by uuid REFERENCES logins,
  responded_on TIMESTAMPTZ,
  reason VARCHAR(255)
)

CREATE UNIQUE INDEX idx_memberships_on_requested_on_asc ON memberships USING btree (requested_on ASC);
