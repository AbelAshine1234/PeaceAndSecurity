import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
} from "class-validator";
import { Transform } from "class-transformer";
import { UserRole } from "../../../common/enums/enums";

/**
 * DTO for creating a dashboard User (admin account).
 * For patrol officers use CreatePatrolDto, for citizens use CreateCitizenDto.
 */
export class CreateUserDto {
  @ApiProperty({ example: "John Doe" })
  @IsString()
  fullName: string;

  @ApiProperty({ example: "+251911234567", required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: "admin@example.com", required: false })
  @IsOptional()
  @IsEmail({}, { message: "Invalid email address" })
  email?: string;

  @ApiProperty({
    enum: [UserRole.SYSTEM_ADMIN, UserRole.SYSTEM_SUPER_ADMIN],
    default: UserRole.SYSTEM_ADMIN,
    description:
      "Dashboard admin role. Use /patrols or /citizens for those user types.",
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiProperty({ type: "array", items: { type: "string" }, required: false })
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? [value] : value))
  @IsArray()
  permissions?: string[];
}
