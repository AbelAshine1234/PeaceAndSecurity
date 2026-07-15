import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class UpdateLocationDto {
  @ApiProperty({ example: 9.0054, description: "Current latitude" })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 38.7636, description: "Current longitude" })
  @IsNumber()
  longitude: number;
}
