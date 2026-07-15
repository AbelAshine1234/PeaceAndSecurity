import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class PhoneLoginDto {
  @ApiProperty({ example: "username (email or phone)" })
  @IsString()
  phoneNumber: string;
  @ApiProperty({ example: "StrongPassword123" })
  @IsString()
  password: string;
}
