import { IsString, IsEmail, IsOptional, IsArray } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";

/**
 * DTO for updating a dashboard User (admin account).
 * Patrol-specific fields (location, office, assignedArea) are handled by UpdatePatrolDto.
 */
export class UpdateUserDto {
  @ApiProperty({ example: "John Doe", required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: "john@example.com", required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: "+251911234567", required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: "profile-image-url.jpg", required: false })
  @IsString()
  @IsOptional()
  profileImage?: string;

  @ApiProperty({
    type: "array",
    items: { type: "string" },
    required: false,
    description: "List of fine-grained permission strings for this admin user",
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? [value] : value))
  @IsArray()
  permissions?: string[];
}
