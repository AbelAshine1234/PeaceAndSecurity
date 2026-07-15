import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsPhoneNumber,
  Length,
} from "class-validator";
import { ReportStatus, NoiseAreaType } from "../../../common/enums/enums";
import { ApiProperty } from "@nestjs/swagger";
import { Type, Transform } from "class-transformer";

export class CreateReportDto {
  @IsOptional()
  @IsString()
  reporterId?: string; // Set by backend if user is authenticated

  @IsOptional()
  @IsString()
  reporterPhoneNumber?: string; // For non-registered citizens

  @IsOptional()
  @IsString()
  violationType?: string;

  @IsOptional()
  @IsString()
  reportType?: string; // Backward compatibility

  @IsOptional()
  @IsString()
  violationTypeId?: string;

  @IsOptional()
  @IsString()
  reportTypeId?: string; // From dashboard form

  @IsOptional()
  @IsString()
  @Length(1, 500, { message: "Report description must be between 1 and 500 characters" })
  @ApiProperty({ example: "Loud construction noise late at night", required: false })
  reportDescription?: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 9.02, description: "Incident latitude" })
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 38.74, description: "Incident longitude" })
  longitude: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "Bole District, Addis Ababa", required: false })
  address?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ["https://storage.com/photo.jpg"], required: false })
  evidenceUrls?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 94.5, description: "Measured decibel level", required: false })
  decibelLevel?: number;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  @ApiProperty({ example: false, default: false })
  isAnonymous?: boolean;

  @IsOptional()
  @IsEnum(NoiseAreaType)
  @ApiProperty({ enum: NoiseAreaType, description: "Residential or Commercial", required: false })
  noiseAreaType?: NoiseAreaType | string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: "Pollution", description: "Pollution or Not Pollution", required: false })
  noisePollutionStatus?: string;
}

export class CreateReportFormDto extends CreateReportDto {
  @ApiProperty({ type: "array", items: { type: "string", format: "binary" }, required: false })
  images?: any[];

  @ApiProperty({ type: "array", items: { type: "string", format: "binary" }, required: false, description: "Gallery or multiple videos" })
  video?: any[];

  @ApiProperty({ type: "array", items: { type: "string", format: "binary" }, required: false })
  audio?: any[];
}

export class UpdateReportDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  @ApiProperty({ enum: ReportStatus, required: false })
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  assignedPatrolId?: string;

  @IsOptional()
  @IsString()
  violationType?: string;

  @IsOptional()
  @IsString()
  reportType?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  patrolNotes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  patrolEvidenceUrls?: string[];

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  reportDescription?: string;

  @IsOptional()
  @IsEnum(NoiseAreaType)
  noiseAreaType?: NoiseAreaType | string;

  @IsOptional()
  @IsString()
  noisePollutionStatus?: string;
}

export class AssignPatrolDto {
  @IsString()
  @ApiProperty({ description: "ID of the patrol officer" })
  patrolId: string;
}

export class PatrolFollowUpDto {
  @IsString()
  @Length(1, 1000)
  @ApiProperty({ description: "Mandatory inspection notes", example: "Verified the noise source at the nightclub." })
  notes: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: "URLs of evidence captured by patrol (photo/video/audio)", required: false })
  evidenceUrls?: string[];

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 9.023 })
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ example: 38.745 })
  longitude: number;
}

export class PatrolFollowUpFormDto extends PatrolFollowUpDto {
  @ApiProperty({ type: "array", items: { type: "string", format: "binary" }, required: false })
  patrolEvidence?: any[];
}
