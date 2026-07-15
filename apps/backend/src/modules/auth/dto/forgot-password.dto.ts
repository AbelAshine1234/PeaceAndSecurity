import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ example: "+251911234567" })
  @IsString()
  @Matches(/^(\+?251|0?)[97]\d{8}$/, {
    message: "Invalid Ethiopian phone number format",
  })
  phoneNumber: string;
}
