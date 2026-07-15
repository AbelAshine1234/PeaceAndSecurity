import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber, Matches, Min, Max } from "class-validator";
import { Transform } from "class-transformer";

/**
 * DTO for registering a new patrol officer from the Admin Dashboard.
 */
export class CreatePatrolDto {
  @ApiProperty({ example: "Kaleb Tesfaye" })
  @IsString()
  fullName: string;

  @ApiProperty({ example: "0911000002", description: "Ethiopian phone number" })
  @IsString()
  @Matches(/^(\+?251|0?)[97]\d{8}$/, {
    message: "Invalid Ethiopian phone number format",
  })
  phoneNumber: string;

  @ApiProperty({ example: "kaleb@tesfaye.com", required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    example: "Bole Sub-City Police Station, Addis Ababa",
    description: "Office / station address",
    required: false,
  })
  @IsOptional()
  @IsString()
  officeAddress?: string;

  @ApiProperty({ example: 9.0054, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Transform(({ value }) =>
    value !== undefined && value !== "" ? Number(value) : undefined,
  )
  officeLatitude?: number;

  @ApiProperty({ example: 38.7636, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Transform(({ value }) =>
    value !== undefined && value !== "" ? Number(value) : undefined,
  )
  officeLongitude?: number;

  @ApiProperty({ example: "Bole District", required: false })
  @IsOptional()
  @IsString()
  assignedArea?: string;

  @ApiProperty({ example: "/uploads/profiles/patrol1.jpg", required: false })
  @IsOptional()
  @IsString()
  profileImage?: string;
}

export class CreatePatrolFormDto extends CreatePatrolDto {
  @ApiProperty({ type: "string", format: "binary", required: false })
  profileImage?: any;
}
