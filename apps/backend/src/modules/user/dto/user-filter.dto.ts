import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole, UserStatus } from "../../../common/enums/enums";

export class UserFilterDto {
  @ApiProperty({ enum: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: true, required: false })
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isStaffUser?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  search?: string;

  @ApiProperty({ example: 1, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ example: 10, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ example: "createdAt", required: false })
  @IsString()
  @IsOptional()
  sortBy?: string = "createdAt";

  @ApiProperty({ example: "DESC", required: false })
  @IsEnum(["ASC", "DESC"])
  @IsOptional()
  sortOrder?: "ASC" | "DESC" = "DESC";
}
