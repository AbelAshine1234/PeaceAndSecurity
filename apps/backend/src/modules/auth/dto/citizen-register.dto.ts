import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class CitizenRegisterDto {
  @ApiProperty({ example: "John Doe" })
  @IsString()
  fullName: string;

  @ApiProperty({ example: "0911222333" })
  @IsString()
  @Matches(/^(\+?251|0?)[97]\d{8}$/, {
    message: "Invalid Ethiopian phone number format",
  })
  phoneNumber: string;
}

export class CitizenRegisterFormDto extends CitizenRegisterDto {
  @ApiProperty({ type: "string", format: "binary", required: false })
  profileImage?: any;
}
