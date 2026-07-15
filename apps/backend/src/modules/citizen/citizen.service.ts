import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Citizen } from "./entities/citizen.entity";
import { CreateCitizenDto } from "./dto/create-citizen.dto";
import { UpdateCitizenDto } from "./dto/update-citizen.dto";
import { UserStatus } from "../../common/enums/enums";
import {
  ServiceResponse,
  successResponse,
} from "../../common/types/service-response";
import { generateRandomCode } from "../../common/utils/generator";
import { hashPassword } from "../../common/utils/password.util";
import { normalizeEtPhone } from "../../common/utils/validator";
import { processUploads } from "../../common/utils/file-upload.util";

@Injectable()
export class CitizenService {
  constructor(
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
  ) { }

  async create(dto: CreateCitizenDto, file?: any): Promise<ServiceResponse> {
    if (file) {
      const [asset] = await processUploads(
        file,
        { baseDir: "uploads", publicBase: "/", makeThumb: false, quality: 82 },
        "profiles",
      );
      dto.profileImage = asset?.url;
    }
    const normalizedPhone = normalizeEtPhone(dto.phoneNumber);
    if (!normalizedPhone)
      throw new BadRequestException("Invalid Ethiopian phone number format");

    const existing = await this.citizenRepository.findOne({
      where: { phoneNumber: normalizedPhone },
    });
    if (existing)
      throw new ConflictException("Phone number already registered");

    const citizen = this.citizenRepository.create({
      fullName: dto.fullName,
      phoneNumber: normalizedPhone,
      userCode: generateRandomCode(8),
      status: UserStatus.PENDING,
      pin: null,
      profileImage: dto.profileImage,
    });

    const saved = await this.citizenRepository.save(citizen);
    const { pin, ...result } = saved as any;
    return successResponse("Citizen created successfully", result);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;

    const qb = this.citizenRepository.createQueryBuilder("citizen");

    if (query.search) {
      qb.andWhere(
        "(citizen.fullName ILIKE :search OR citizen.phoneNumber ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    if (query.status) {
      qb.andWhere("citizen.status = :status", { status: query.status });
    }

    const [data, total] = await qb
      .orderBy("citizen.createdAt", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const items = data.map(({ pin, ...safe }: any) => safe);

    return {
      success: true,
      message: "Citizens retrieved successfully",
      statusCode: 200,
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ServiceResponse> {
    const citizen = await this.citizenRepository.findOne({ where: { id } });
    if (!citizen)
      throw new NotFoundException(`Citizen with ID ${id} not found`);
    const { pin, ...result } = citizen as any;
    return successResponse("Citizen retrieved successfully", result);
  }

  async getCitizenById(id: string): Promise<Citizen | null> {
    return this.citizenRepository.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateCitizenDto, file?: any): Promise<ServiceResponse> {
    const citizen = await this.citizenRepository.findOne({ where: { id } });
    if (!citizen)
      throw new NotFoundException(`Citizen with ID ${id} not found`);

    if (file) {
      const [asset] = await processUploads(
        file,
        { baseDir: "uploads", publicBase: "/", makeThumb: false, quality: 82 },
        "profiles",
      );
      dto.profileImage = asset?.url;
    }

    if (dto.phoneNumber) {
      const normalizedPhone = normalizeEtPhone(dto.phoneNumber);
      if (!normalizedPhone)
        throw new BadRequestException("Invalid Ethiopian phone number format");
      dto.phoneNumber = normalizedPhone;
    }

    Object.assign(citizen, dto);
    const updated = await this.citizenRepository.save(citizen);
    const { pin, ...result } = updated as any;
    return successResponse("Citizen updated successfully", result);
  }

  async remove(id: string): Promise<ServiceResponse> {
    const citizen = await this.citizenRepository.findOne({ where: { id } });
    if (!citizen)
      throw new NotFoundException(`Citizen with ID ${id} not found`);
    await this.citizenRepository.delete(id);
    return successResponse("Citizen deleted successfully");
  }

  async getCitizenProfile(id: string): Promise<ServiceResponse> {
    const citizen = await this.citizenRepository.findOne({ where: { id } });
    if (!citizen) throw new NotFoundException("Citizen not found");
    const { pin, ...result } = citizen as any;
    return successResponse("Profile retrieved successfully", result);
  }

  async updateCitizenProfile(
    id: string,
    dto: UpdateCitizenDto,
  ): Promise<ServiceResponse> {
    const citizen = await this.citizenRepository.findOne({ where: { id } });
    if (!citizen) throw new NotFoundException("Citizen not found");

    if (dto.phoneNumber) {
      const normalizedPhone = normalizeEtPhone(dto.phoneNumber);
      if (!normalizedPhone)
        throw new BadRequestException("Invalid Ethiopian phone number format");

      const existing = await this.citizenRepository.findOne({
        where: { phoneNumber: normalizedPhone },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException("Phone number already in use");
      }
      citizen.phoneNumber = normalizedPhone;
    }

    if (dto.fullName) citizen.fullName = dto.fullName;
    if (dto.profileImage) citizen.profileImage = dto.profileImage;

    const updated = await this.citizenRepository.save(citizen);
    const { pin, ...result } = updated as any;
    return successResponse("Profile updated successfully", result);
  }

}
