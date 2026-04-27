import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
const xss = require('xss-clean'); // CommonJS import for older package
import hpp from 'hpp';
import config from '../../config/environment';

/**
 * Creates the sanitization middleware pipeline.
 * Order: Size limits -> Parameter Pollution -> NoSQL Injection -> XSS Protection
 */
export const sanitizationPipeline = [
  // 1. Raw body limit for JSON responses
  express.json({ limit: `${config.MAX_REQUEST_SIZE_MB || 10}mb` }),
  
  // URL encoded payloads
  express.urlencoded({ extended: true, limit: `${config.MAX_REQUEST_SIZE_MB || 10}mb` }),

  // 2. Prevent HTTP Parameter Pollution (e.g., duplicated query string parameters)
  hpp(),

  // 3. NoSQL Injection Prevention
  // Replaces prohibitted characters ($ or .) in keys with safe characters
  mongoSanitize({
    replaceWith: '_',
    allowDots: false,
  }),

  // 4. XSS Prevention
  // Cleans user input from potential script tags
  xss(),
];
