import { TokenType } from "common/enums/enums";
export interface BaseTokenPayload {
  sub: string;
  phoneNumber?: string;
  email?: string;
  type?: TokenType;
  [key: string]: any;
}
