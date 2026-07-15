import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Camera } from "./entities/camera.entity";
import { CameraAlert, CameraAlertStatus } from "./entities/camera-alert.entity";
import { NotificationsGateway } from "../notifications/notifications.gateway";

@Injectable()
export class CamerasService {
  constructor(
    @InjectRepository(Camera)
    private readonly cameraRepo: Repository<Camera>,
    @InjectRepository(CameraAlert)
    private readonly alertRepo: Repository<CameraAlert>,
    private readonly notificationsGateway: NotificationsGateway,
  ) { }

  async create(createCameraDto: any) {
    return await this.cameraRepo.save(createCameraDto);
  }

  async findAll() {
    return await this.cameraRepo.find();
  }

  async findOne(id: string) {
    return await this.cameraRepo.findOneBy({ id });
  }

  async update(id: string, updateCameraDto: any) {
    await this.cameraRepo.update(id, updateCameraDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    return await this.cameraRepo.delete(id);
  }

  async createAlert(
    cameraId: string,
    violationType: string,
    evidenceUrl?: string,
    confidenceScore?: number,
  ) {
    const camera = await this.findOne(cameraId);
    if (!camera) return null;

    const alert = this.alertRepo.create({
      cameraId,
      violationType,
      evidenceUrl,
      confidenceScore: confidenceScore ?? 0,
      status: CameraAlertStatus.OPEN,
    });

    const savedAlert = await this.alertRepo.save(alert);

    // Real-time notification for Admins
    this.notificationsGateway.broadcast("camera_violation", {
      id: savedAlert.id,
      cameraId: camera.cameraId,
      locationName: camera.locationName,
      violationType: savedAlert.violationType,
      confidenceScore: savedAlert.confidenceScore,
      latitude: camera.latitude,
      longitude: camera.longitude,
      timestamp: savedAlert.createdAt,
    });

    return savedAlert;
  }

  async findAllAlerts() {
    return await this.alertRepo.find({
      relations: ["camera"],
      order: { createdAt: "DESC" },
    });
  }

  async updateAlertStatus(id: string, status: CameraAlertStatus) {
    await this.alertRepo.update(id, { status });
    return await this.alertRepo.findOne({ where: { id }, relations: ["camera"] });
  }
}
