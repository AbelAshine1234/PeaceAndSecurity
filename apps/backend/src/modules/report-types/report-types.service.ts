import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { ReportType } from "./entities/report-type.entity";
import { CreateReportTypeDto, UpdateReportTypeDto } from "./dto/report-type.dto";
import { ReportTypeEnum } from "../../common/enums/enums";

@Injectable()
export class ReportTypesService {
  constructor(
    @InjectRepository(ReportType)
    private readonly reportTypeRepo: Repository<ReportType>,
  ) { }

  async create(dto: CreateReportTypeDto) {
    if (!dto.name) {
      throw new BadRequestException("Report type name is required.");
    }

    // Check for duplicate name
    const existing = await this.reportTypeRepo.findOneBy({ name: dto.name });
    if (existing) {
      throw new ConflictException(
        `A report type with name "${dto.name}" is already registered.`,
      );
    }

    const reportType = this.reportTypeRepo.create(dto);
    return await this.reportTypeRepo.save(reportType);
  }

  async findAll(query?: { search?: string; isActive?: string }) {
    const qb = this.reportTypeRepo.createQueryBuilder("rt");

    if (query?.search) {
      qb.andWhere("(rt.name ILIKE :search OR rt.description ILIKE :search)", {
        search: `%${query.search}%`,
      });
    }

    if (query?.isActive !== undefined) {
      qb.andWhere("rt.isActive = :isActive", {
        isActive: query.isActive === "true",
      });
    }

    return await qb.orderBy("rt.name", "ASC").getMany();
  }

  async findOne(id: string) {
    if (!id) {
      throw new BadRequestException("Report type ID is required.");
    }

    const reportType = await this.reportTypeRepo.findOneBy({ id });
    if (!reportType) {
      throw new NotFoundException(`Report type with ID "${id}" not found.`);
    }

    return reportType;
  }

  async update(id: string, dto: UpdateReportTypeDto) {
    if (!id) {
      throw new BadRequestException("Report type ID is required.");
    }

    // Ensure the record exists
    const existing = await this.reportTypeRepo.findOneBy({ id });
    if (!existing) {
      throw new NotFoundException(`Report type with ID "${id}" not found.`);
    }

    // If renaming, check for conflict with another existing record
    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.reportTypeRepo.findOneBy({ name: dto.name });
      if (conflict) {
        throw new ConflictException(
          `A report type with name "${dto.name}" is already registered.`,
        );
      }
    }

    await this.reportTypeRepo.update(id, dto);
    return this.reportTypeRepo.findOneBy({ id });
  }

  async remove(id: string) {
    if (!id) {
      throw new BadRequestException("Report type ID is required.");
    }

    const existing = await this.reportTypeRepo.findOneBy({ id });
    if (!existing) {
      throw new NotFoundException(`Report type with ID "${id}" not found.`);
    }

    // Protect the default "OTHERS" fallback type from deletion
    if (existing.name === ReportTypeEnum.OTHERS) {
      throw new BadRequestException(
        `The default report type "${ReportTypeEnum.OTHERS}" cannot be deleted.`,
      );
    }

    return await this.reportTypeRepo.delete(id);
  }
}
