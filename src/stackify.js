/**
 * Stackify Node APM Configuration
 */
const appName = process.env.STACKIFY_NAME ? process.env.STACKIFY_NAME : 'Shipping Application'
const appEnv = process.env.STACKIFY_ENV ? process.env.STACKIFY_ENV : 'Development'

exports.config = {
  /**
   * Your application name.
   */
  application_name: appName,
  /**
   * Your environment name.
   */
  environment_name: appEnv
}
