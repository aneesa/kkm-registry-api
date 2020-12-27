// https://github.com/pgroot/express-swagger-generator

/**
 * @typedef Get_Authorized
 * @property {Authorized.model} authorized
 */

/**
 * @typedef Authorized
 * @property {boolean} is_authorized
 * @property {string} access_token
 * @property {Authorized_User.model} auth_user
 */

/**
 * @typedef Authorized_User
 * @property {string} user_id.required
 * @property {string} user_email
 * @property {string} user_name
 * @property {string} user_role
 * @property {string} user_last_login
 */

/**
 * @typedef Registering_User
 * @property {string} name.required
 * @property {string} email.required
 * @property {string} password.required
 */

/**
 * @typedef Login_User
 * @property {string} email.required
 * @property {string} password.required
 */

/**
 * @typedef User
 * @property {string} user_id
 * @property {string} user_email
 * @property {string} user_name
 * @property {string} user_membership_no
 * @property {string} user_phone_no
 * @property {string} user_home_address
 * @property {string} user_last_login
 */

/**
 * @typedef Get_Users
 * @property {Authorized.model} authorized
 * @property {Array.<User>} users
 */

/**
 * @typedef Get_User
 * @property {Authorized.model} authorized
 * @property {User.model} user
 */

/**
 * @typedef Error
 * @property {string} message
 * @property {Authorized.model} authorized
 */
