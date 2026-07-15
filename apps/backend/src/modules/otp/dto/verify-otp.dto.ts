import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsUUID,
  Matches,
  Length,
  IsEnum,
  IsEmail,
  ValidateIf,
} from "class-validator";
import { OTPStatus, OTPType } from "../../../common/enums/enums";

export class VerifyOtpDto {
  @ApiProperty({
    enum: OTPType,
    example: OTPType.REGISTRATION_OTP,
    description: "Purpose/category of the OTP being verified",
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

  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({ example: "2a0e0c1b-9c2b-43f0-bd3f-1c7f9e0f3b2a" })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: OTPStatus.REQUESTED })
  @IsUUID()
  status: OTPStatus;
}
