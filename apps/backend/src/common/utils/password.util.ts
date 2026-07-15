import * as bcrypt from "bcrypt";
export const hashPassword = async (pwd: string) => bcrypt.hash(pwd, 10);
export const comparePassword = async (pwd: string, hashed: string) =>
  bcrypt.compare(pwd, hashed);
