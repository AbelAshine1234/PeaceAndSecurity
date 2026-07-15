import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().default(1221),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow("").required(),
  DB_NAME: Joi.string().required(),
  DB_SSL: Joi.boolean().default(false),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  JWT_REG_SECRET: Joi.string().required(),
  JWT_REG_EXPIRES_IN: Joi.string().default("10m"),
  JWT_SET_PASSWORD_SECRET: Joi.string().required(),
  JWT_SET_PASSWORD_EXPIRES_IN: Joi.string().default("10m"),
  JWT_PASSWORD_RESET_SECRET: Joi.string().required(),
  JWT_PASSWORD_RESET_EXPIRES_IN: Joi.string().default("10m"),

  REDIS_HOST: Joi.string().optional(),
  REDIS_PORT: Joi.number().optional(),
  BASE_URL: Joi.string().uri().optional().default("http://localhost:5000"),
  ALLOWED_ORIGINS: Joi.string().optional().default(""),
});
