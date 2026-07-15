import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ReportTypeEnum } from "../../../common/enums/enums";

export class CreateReportTypeDto {
    @ApiProperty({ example: "NOISE", enum: ReportTypeEnum, description: "Name of the violation type" })
    @IsEnum(ReportTypeEnum)
    name: ReportTypeEnum;

    @ApiPropertyOptional({ example: "Loud music or construction noise", description: "Detailed description" })
    @IsString()
    @IsOptional()
    description?: string;

    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ example: 45.0, description: "Decibel threshold for noise reports in residential areas" })
    @IsOptional()
    @IsNumber()
    residentialDecibelThreshold?: number;

    @ApiPropertyOptional({ example: 55.0, description: "Decibel threshold for noise reports in commercial areas" })
    @IsOptional()
    @IsNumber()
    commercialDecibelThreshold?: number;
}

export class UpdateReportTypeDto {
    @ApiPropertyOptional({ enum: ReportTypeEnum })
    @IsEnum(ReportTypeEnum)
    @IsOptional()
    name?: ReportTypeEnum;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    residentialDecibelThreshold?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    commercialDecibelThreshold?: number;
}
