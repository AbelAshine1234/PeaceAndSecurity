import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { OTPType } from "common/enums/enums";

export class VerifyOTPDto {
  @ApiProperty({ example: "123456" })
  @IsString()
  otpCode: string;

  @ApiProperty({ example: OTPType.REGISTRATION_OTP })
  @IsString()
  otpType: OTPType;
}
