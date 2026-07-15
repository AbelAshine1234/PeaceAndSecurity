import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class SetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(4)
  password: string;
}
