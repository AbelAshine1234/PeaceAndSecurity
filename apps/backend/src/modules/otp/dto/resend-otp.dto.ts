import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  Matches,
  IsEnum,
  IsEmail,
  ValidateIf,
} from "class-validator";
import { OTPType } from "../../../common/enums/enums";

export class ResendOtpDto {
  @ApiProperty({
    enum: OTPType,
    example: OTPType.REGISTRATION_OTP,
    description: "Purpose/category of the OTP to resend",
  })
  @IsEnum(OTPType)
  otpType: OTPType;

  @ApiProperty({
    example: "+251911234567",
    required: false,
    description: "Ethiopian phone number; required if email is not provided",
  })
  @ValidateIf((o) => !o.email)
  @IsString()
  @Matches(/^(\+?251|0?)[97]\d{8}$/, {
    message: "Invalid Ethiopian phone number format",
  })
  phoneNumber?: string;

  @ApiProperty({
    example: "user@example.com",
    required: false,
    description: "Email address; required if phone number is not provided",
  })
  @ValidateIf((o) => !o.phoneNumber)
  @IsEmail({}, { message: "Invalid email address" })
  email?: string;
}
