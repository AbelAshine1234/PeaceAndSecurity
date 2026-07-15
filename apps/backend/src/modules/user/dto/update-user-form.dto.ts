import { ApiProperty } from "@nestjs/swagger";
import { UpdateUserDto } from "./update-user.dto";

export class UpdateUserFormDto extends UpdateUserDto {
  @ApiProperty({
    type: "string",
    format: "binary",
    required: false,
    description: "Optional profile image (JPG/PNG, max 5MB)",
  })
  profileImage?: string;
}
