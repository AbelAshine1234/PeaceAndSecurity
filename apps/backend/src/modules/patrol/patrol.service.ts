import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Patrol } from "./entities/patrol.entity";
import { CreatePatrolDto } from "./dto/create-patrol.dto";
import { UpdatePatrolDto } from "./dto/update-patrol.dto";
import { UserStatus } from "../../common/enums/enums";
import {
  ServiceResponse,
  successResponse,
} from "../../common/types/service-response";
import { generateRandomCode } from "../../common/utils/generator";
import { hashPassword } from "../../common/utils/password.util";
import { normalizeEtPhone } from "../../common/utils/validator";
import { sendSMS } from "../../common/utils/sms-sender";
import { getDistance } from "../../common/utils/geo-util";
import { processUploads } from "../../common/utils/file-upload.util";

@Injectable()
export class PatrolService {
  constructor(
    @InjectRepository(Patrol)
    private readonly patrolRepository: Repository<Patrol>,
  ) { }

  async create(dto: CreatePatrolDto, file?: any): Promise<ServiceResponse> {
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

    const existing = await this.patrolRepository.findOne({
      where: { phoneNumber: normalizedPhone },
    });
    if (existing)
      throw new ConflictException("Phone number already registered");

    const patrol = this.patrolRepository.create({
      fullName: dto.fullName,
      phoneNumber: normalizedPhone,
      email: dto.email,
      userCode: generateRandomCode(8),
      status: UserStatus.PENDING,
      officeAddress: dto.officeAddress,
      officeLatitude: dto.officeLatitude,
      officeLongitude: dto.officeLongitude,
      assignedArea: dto.assignedArea,
      profileImage: dto.profileImage,
    });

    const saved = await this.patrolRepository.save(patrol);

    sendSMS({
      recipient: normalizedPhone,
      messageBody: `[EcoGuard] Welcome, ${dto.fullName}! Your patrol account has been created by the administrator. Please download the EcoGuard Patrol app and set your login PIN using your phone number.`,
    }).catch(() => void 0);

    const { pin, ...result } = saved as any;
    return successResponse("Patrol officer registered successfully", result);
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

    const qb = this.patrolRepository.createQueryBuilder("patrol");

    if (query.search) {
      qb.andWhere(
        "(patrol.fullName ILIKE :search OR patrol.phoneNumber ILIKE :search OR patrol.assignedArea ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    if (query.status) {
      qb.andWhere("patrol.status = :status", { status: query.status });
    }

    const [data, total] = await qb
      .orderBy("patrol.createdAt", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const items = data.map(({ pin, ...safe }: any) => safe);

    return {
      success: true,
      message: "Patrol officers retrieved successfully",
      statusCode: 200,
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<ServiceResponse> {
    const patrol = await this.patrolRepository.findOne({ where: { id } });
    if (!patrol)
      throw new NotFoundException(`Patrol officer with ID ${id} not found`);
    const { pin, ...result } = patrol as any;
    return successResponse("Patrol officer retrieved successfully", result);
  }

  async getPatrolById(id: string): Promise<Patrol | null> {
    return this.patrolRepository.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdatePatrolDto, file?: any): Promise<ServiceResponse> {
    const patrol = await this.patrolRepository.findOne({ where: { id } });
    if (!patrol)
      throw new NotFoundException(`Patrol officer with ID ${id} not found`);

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

    Object.assign(patrol, dto);
    const updated = await this.patrolRepository.save(patrol);
    const { pin, ...result } = updated as any;
    return successResponse("Patrol officer updated successfully", result);
  }

  async remove(id: string): Promise<ServiceResponse> {
    const patrol = await this.patrolRepository.findOne({ where: { id } });
    if (!patrol)
      throw new NotFoundException(`Patrol officer with ID ${id} not found`);
    await this.patrolRepository.delete(id);
    return successResponse("Patrol officer deleted successfully");
  }

  async updateLocation(
    id: string,
    latitude: number,
    longitude: number,
  ): Promise<ServiceResponse> {
    const patrol = await this.patrolRepository.findOne({ where: { id } });
    if (!patrol) throw new NotFoundException("Patrol officer not found");

    patrol.latitude = latitude;
    patrol.longitude = longitude;
    patrol.lastLocationUpdate = new Date();
    await this.patrolRepository.save(patrol);

    return successResponse("Location updated", { latitude, longitude });
  }

  async findNearby(
    lat: number,
    lon: number,
    radiusKm = 10,
  ): Promise<ServiceResponse> {
    const allPatrols = await this.patrolRepository.find({
      where: { status: UserStatus.ACTIVE },
    });

    const nearby = allPatrols
      .map((p) => {
        const pLat = Number(p.latitude ?? p.officeLatitude);
        const pLon = Number(p.longitude ?? p.officeLongitude);

        if (isNaN(pLat) || isNaN(pLon)) return null;

        const distanceKm = getDistance(lat, lon, pLat, pLon) / 1000;
        return {
          ...p,
          distanceKm,
        };
      })
      .filter((p): p is any => p !== null && p.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // Remove sensitive info
    const safeItems = nearby.map(({ pin, ...safe }) => safe);

    return successResponse("Nearby patrol officers retrieved", safeItems);
  }

  async getPatrolProfile(id: string): Promise<ServiceResponse> {
    const patrol = await this.patrolRepository.findOne({ where: { id } });
    if (!patrol) throw new NotFoundException("Patrol officer not found");
    const { pin, ...result } = patrol as any;
    return successResponse("Profile retrieved successfully", result);
  }

  async updatePatrolProfile(
    id: string,
    dto: UpdatePatrolDto,
  ): Promise<ServiceResponse> {
    const patrol = await this.patrolRepository.findOne({ where: { id } });
    if (!patrol) throw new NotFoundException("Patrol officer not found");

    if (dto.phoneNumber) {
      const normalizedPhone = normalizeEtPhone(dto.phoneNumber);
      if (!normalizedPhone)
        throw new BadRequestException("Invalid Ethiopian phone number format");

      const existing = await this.patrolRepository.findOne({
        where: { phoneNumber: normalizedPhone },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException("Phone number already in use");
      }
      patrol.phoneNumber = normalizedPhone;
    }

    if (dto.fullName) patrol.fullName = dto.fullName;
    if (dto.email) patrol.email = dto.email;
    if (dto.profileImage) patrol.profileImage = dto.profileImage;
    if (dto.officeAddress) patrol.officeAddress = dto.officeAddress;
    if (dto.officeLatitude !== undefined)
      patrol.officeLatitude = dto.officeLatitude;
    if (dto.officeLongitude !== undefined)
      patrol.officeLongitude = dto.officeLongitude;
    if (dto.assignedArea) patrol.assignedArea = dto.assignedArea;

    const updated = await this.patrolRepository.save(patrol);
    const { pin, ...result } = updated as any;
    return successResponse("Profile updated successfully", result);
  }
}
