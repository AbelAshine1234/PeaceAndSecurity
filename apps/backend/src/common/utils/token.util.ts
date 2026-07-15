import { JwtService } from "@nestjs/jwt";
import { TokenType } from "common/enums/enums";
import { BaseTokenPayload } from "../interfaces/token";

export const signAccessToken = (jwt: JwtService, payload: BaseTokenPayload) =>
  jwt.sign(
    { ...payload, type: TokenType.ACCESS },
    {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    },
  );

export const signRefreshToken = (jwt: JwtService, payload: BaseTokenPayload) =>
  jwt.sign(
    { ...payload, type: TokenType.REFRESH },
    {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
  );

export const signRegistrationToken = (
  jwt: JwtService,
  payload: BaseTokenPayload,
) =>
  jwt.sign(
    { ...payload, type: TokenType.REGISTRATION },
    {
      secret: process.env.JWT_REGISTRATION_SECRET,
      expiresIn: process.env.JWT_REGISTRATION_EXPIRES_IN || "10m",
    },
  );

export const signSetPasswordToken = (
  jwt: JwtService,
  payload: BaseTokenPayload,
) =>
  jwt.sign(
    { ...payload, type: TokenType.SET_PASSWORD },
    {
      secret: process.env.JWT_SET_PASSWORD_SECRET,
      expiresIn: process.env.JWT_SET_PASSWORD_EXPIRES_IN || "10m",
    },
  );

export const signPasswordResetToken = (
  jwt: JwtService,
  payload: BaseTokenPayload,
) =>
  jwt.sign(
    { ...payload, type: TokenType.PASSWORD_RESET },
    {
      secret: process.env.JWT_PASSWORD_RESET_SECRET,
      expiresIn: process.env.JWT_PASSWORD_RESET_EXPIRES_IN || "10m",
    },
  );

export const signPinResetToken = (
  jwt: JwtService,
  payload: BaseTokenPayload,
) =>
  jwt.sign(
    { ...payload, type: TokenType.PIN_RESET },
    {
      secret: process.env.JWT_PASSWORD_RESET_SECRET,
      expiresIn: process.env.JWT_PASSWORD_RESET_EXPIRES_IN || "10m",
    },
  );

export const verifyToken = <T extends object = any>(
  jwt: JwtService,
  token: string,
  secret: string,
): T => {
  return jwt.verify<T>(token, { secret });
};
