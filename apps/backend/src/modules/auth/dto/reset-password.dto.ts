import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  otpCode: string;
  @ApiProperty()
  @IsString()
  @MinLength(4)
  newPassword: string;
}
