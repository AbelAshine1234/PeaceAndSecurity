import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, Matches, Length } from "class-validator";

/**
 * DTO for creating a citizen account from the Admin Dashboard
 * OR via self-registration from the Citizen App.
 * Scoped to citizen-only fields.
 */
export class CreateCitizenDto {
  @ApiProperty({ example: "Abebe Bikila" })
  @IsString()
  fullName: string;

  @ApiProperty({
    example: "0911222333",
    description: "Ethiopian phone number used as login credential",
  })
  @IsString()
  @Matches(/^(\+?251|0?)[97]\d{8}$/, {
    message: "Invalid Ethiopian phone number format",
  })
  phoneNumber: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profileImage?: string;
}

export class CreateCitizenFormDto extends CreateCitizenDto {
  @ApiProperty({ type: "string", format: "binary", required: false })
  profileImage?: any;
}
