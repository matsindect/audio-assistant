/**
 * Custom error class for handling application-specific errors.
 * Extends the built-in Error class.
 *
 * @class AppError
 * @extends {Error}
 * 
 * @param {string} message - The error message.
 * @param {number} statusCode - The HTTP status code associated with the error.
 * 
 * @property {number} statusCode - The HTTP status code.
 * @property {string} status - The error status ('fail' for 4xx codes, 'error' for others).
 * @property {boolean} isOperational - Indicates if the error is operational (true).
 */
class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
  
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export default AppError;
