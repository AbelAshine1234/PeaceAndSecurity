import { ApiProperty } from "@nestjs/swagger";
import { CreateUserDto } from "./create-user.dto";

export class CreateUserFormDto extends CreateUserDto {
  @ApiProperty({
    type: "string",
    format: "binary",
    required: false,
    description: "Optional profile image (JPG/PNG, max 5MB)",
  })
  profileImage?: string;
}
