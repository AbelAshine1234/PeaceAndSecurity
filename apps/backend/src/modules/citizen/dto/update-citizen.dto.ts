import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

/**
 * DTO for updating a citizen's profile.
 * Admins can edit these fields from the dashboard.
 * Citizens can update their own profile via the /users/profile endpoint.
 */
export class UpdateCitizenDto {
  @ApiProperty({ example: "Abebe Bikila Jr.", required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: "0911222333", required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profileImage?: string;
}

export class UpdateCitizenFormDto extends UpdateCitizenDto {
  @ApiProperty({ type: "string", format: "binary", required: false })
  profileImage?: any;
}
