import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";

export class ConfirmPinResetDto {
  @ApiProperty()
  @IsString()
  otpCode: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  newPin: string;
}
