import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber, Min, Max } from "class-validator";
import { Transform } from "class-transformer";

/**
 * DTO for updating a patrol officer's profile from the Admin Dashboard.
 */
export class UpdatePatrolDto {
  @ApiProperty({ example: "Kaleb Tesfaye", required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: "0911000002", required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: "kaleb@tesfaye.com", required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    example: "Bole Sub-City Police Station, Addis Ababa",
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

  @ApiProperty({ example: "Yeka District", required: false })
  @IsOptional()
  @IsString()
  assignedArea?: string;

  @ApiProperty({ example: "/uploads/profiles/patrol1.jpg", required: false })
  @IsOptional()
  @IsString()
  profileImage?: string;
}

export class UpdatePatrolFormDto extends UpdatePatrolDto {
  @ApiProperty({ type: "string", format: "binary", required: false })
  profileImage?: any;
}
