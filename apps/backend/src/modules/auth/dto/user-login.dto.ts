import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsEmail } from "class-validator";

export class UserLoginDto {
  @ApiProperty({ example: "+251911234567", required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: "admin@example.com", required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: "StrongPassword123" })
  @IsString()
  password: string;
}
