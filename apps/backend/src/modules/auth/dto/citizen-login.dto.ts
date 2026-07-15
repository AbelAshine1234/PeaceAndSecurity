import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, Matches } from "class-validator";

export class CitizenLoginDto {
  @ApiProperty({
    example: "+251911234567",
    description: "Citizen phone number",
  })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    example: "1234",
    description: "4-6 digit PIN set during citizen registration",
  })
  @IsString()
  @Length(4, 6, { message: "PIN must be 4–6 digits" })
  @Matches(/^\d+$/, { message: "PIN must contain only digits" })
  pin: string;
}
