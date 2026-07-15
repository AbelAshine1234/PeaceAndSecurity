import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { sendSMS } from "../../common/utils/sms-sender";
import { normalizeEtPhone } from "../../common/utils/validator";
import { generateRandomCode } from "../../common/utils/generator";
import { Report } from "./entities/report.entity";
import { ReportLog } from "./entities/report-log.entity";
import {
  NoiseAreaType,
  NotificationType,
  ReportStatus,
  ReportTypeEnum,
  UserRole,
} from "../../common/enums/enums";
import { Patrol } from "../patrol/entities/patrol.entity";
import { ReportTypesService } from "../report-types/report-types.service";
import { NotificationsGateway } from "../notifications/notifications.gateway";
import { getDistance } from "../../common/utils/geo-util";
import { processUploads } from "../../common/utils/file-upload.util";
import { ReportType as ReportTypeEntity } from "../report-types/entities/report-type.entity";
import { User } from "../user/entities/user.entity";

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(ReportLog)
    private readonly logRepo: Repository<ReportLog>,
    @InjectRepository(Patrol)
    private readonly patrolRepo: Repository<Patrol>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly reportTypesService: ReportTypesService,
    private readonly notificationsGateway: NotificationsGateway,
  ) { }

  private async findNearestPatrol(lat: number, lon: number, maxDistanceKm = 15): Promise<Patrol | null> {
    const activePatrols = await this.patrolRepo.find({
      where: { status: "ACTIVE" as any },
    });

    if (activePatrols.length === 0) return null;

    let nearest: Patrol | null = null;
    let minDistance = Infinity;

    for (const patrol of activePatrols) {
      const pLat = Number(patrol.latitude ?? patrol.officeLatitude);
      const pLon = Number(patrol.longitude ?? patrol.officeLongitude);

      if (isNaN(pLat) || isNaN(pLon)) continue;

      const dist = getDistance(lat, lon, pLat, pLon) / 1000; // to Km
      if (dist < minDistance && dist <= maxDistanceKm) {
        minDistance = dist;
        nearest = patrol;
      }
    }
    return nearest;
  }

  private async logStatus(
    reportId: string,
    status: ReportStatus,
    actor: { userId?: string; patrolId?: string; citizenId?: string },
    notes?: string,
    location?: { latitude: number; longitude: number },
  ) {
    const log = this.logRepo.create({
      reportId,
      status,
      userId: actor.userId,
      patrolId: actor.patrolId,
      citizenId: actor.citizenId,
      notes,
      latitude: location?.latitude,
      longitude: location?.longitude,
    });
    await this.logRepo.save(log);
  }

  private async notifyAdmins(title: string, message: string, type: NotificationType, data: any) {
    const admins = await this.userRepo.find({
      where: { role: In([UserRole.SYSTEM_ADMIN, UserRole.SYSTEM_SUPER_ADMIN]) },
    });
    for (const admin of admins) {
      this.notificationsGateway.notifyUser(admin.id, admin.role, {
        title,
        message,
        type,
        data,
        fcmToken: admin.fcmToken,
      });
    }
  }

  private readonly STATUS_LABELS: Partial<Record<ReportStatus, { title: string; citizenMsg: (caseId: string, extra?: string) => string; patrolMsg: (caseId: string, extra?: string) => string }>> = {
    [ReportStatus.SUBMITTED]: { title: "Report Received", citizenMsg: (c) => `Your report ${c} has been received and is being processed.`, patrolMsg: (c) => `New report ${c} submitted.` },
    [ReportStatus.ASSIGNED]: { title: "Officer Assigned", citizenMsg: (c, x) => `A patrol officer has been assigned to your case ${c}. ${x || ''}`.trim(), patrolMsg: (c, x) => `Case ${c} has been assigned to you. ${x || ''}`.trim() },
    [ReportStatus.IN_PROGRESS]: { title: "Case In Progress 🚔", citizenMsg: (c, x) => `A patrol officer is now handling your case ${c}. ${x || ''}`.trim(), patrolMsg: (c, x) => `Case ${c} is now in progress. ${x || ''}`.trim() },
    [ReportStatus.UNDER_REVIEW]: { title: "Case Under Review 🔍", citizenMsg: (c, x) => `Your case ${c} is being reviewed by our team. ${x || ''}`.trim(), patrolMsg: (c, x) => `Case ${c} is under review. ${x || ''}`.trim() },
    [ReportStatus.CLOSED]: { title: "Case Resolved ✅", citizenMsg: (c, x) => `Your case ${c} has been resolved and closed. Thank you for reporting! ${x || ''}`.trim(), patrolMsg: (c, x) => `Case ${c} has been closed. ${x || ''}`.trim() },
    [ReportStatus.REJECTED]: { title: "Case Rejected ❌", citizenMsg: (c, x) => `Your case ${c} could not be processed. ${x || ''}`.trim(), patrolMsg: (c, x) => `Case ${c} was rejected. ${x || ''}`.trim() },
    [ReportStatus.ESCALATED]: { title: "Case Escalated ⚡", citizenMsg: (c, x) => `Your case ${c} has been escalated to senior authority for further action. ${x || ''}`.trim(), patrolMsg: (c, x) => `Case ${c} has been escalated. ${x || ''}`.trim() },
  };

  private async notifyStatusChange(report: Report, status: ReportStatus, notes?: string) {
    const label = this.STATUS_LABELS[status];
    const title = label?.title ?? "Case Status Updated";

    // ── Citizen Push ──
    if (report.reporterId) {
      const citizen = await this.reportRepo.manager.getRepository("Citizen").findOne({ where: { id: report.reporterId } }) as any;
      if (citizen) {
        const msg = label ? label.citizenMsg(report.caseId, notes) : `Your case ${report.caseId} is now ${status}. ${notes || ''}`.trim();
        this.notificationsGateway.notifyUser(report.reporterId, "CITIZEN", {
          title,
          message: msg,
          type: NotificationType.REPORT_STATUS_UPDATED,
          data: { reportId: report.id, caseId: report.caseId, status },
          fcmToken: citizen.fcmToken,
        });
      }
    }

    // ── Patrol Push (only for statuses relevant to patrol, skip SUBMITTED) ──
    if (report.assignedPatrolId && status !== ReportStatus.SUBMITTED) {
      const patrol = await this.patrolRepo.findOne({ where: { id: report.assignedPatrolId } });
      if (patrol) {
        const msg = label ? label.patrolMsg(report.caseId, notes) : `Case ${report.caseId} is now ${status}. ${notes || ''}`.trim();
        this.notificationsGateway.notifyUser(report.assignedPatrolId, "PATROL", {
          title,
          message: msg,
          type: NotificationType.REPORT_STATUS_UPDATED,
          data: { reportId: report.id, caseId: report.caseId, status },
          fcmToken: patrol.fcmToken,
        });
      }
    }
  }

  private getAreaFromCoordinates(
    lat: number,
    lon: number,
    address?: string,
  ): string {
    if (address) {
      const parts = address.split(",");
      if (parts.length > 1) return parts[parts.length - 2].trim();
    }
    const latBase = Math.floor(lat * 10) / 10;
    const lonBase = Math.floor(lon * 10) / 10;
    return `Sector ${latBase}/${lonBase}`;
  }

  async create(createReportDto: any, userId?: string, files?: { images?: any[]; video?: any[]; audio?: any[] }) {
    if (files) {
      const savedAssets = await processUploads(
        files,
        { baseDir: "uploads", publicBase: "/", makeThumb: true },
        "reports",
      );

      // Categorise by field name for gallery tabs
      if (!createReportDto.imageUrls) createReportDto.imageUrls = [];
      if (!createReportDto.videoUrls) createReportDto.videoUrls = [];
      if (!createReportDto.audioUrls) createReportDto.audioUrls = [];
      if (!createReportDto.evidenceUrls) {
        createReportDto.evidenceUrls = [];
      } else if (typeof createReportDto.evidenceUrls === 'string') {
        try {
          createReportDto.evidenceUrls = JSON.parse(createReportDto.evidenceUrls);
        } catch {
          createReportDto.evidenceUrls = [createReportDto.evidenceUrls];
        }
      }

      for (const asset of savedAssets) {
        const mime = asset.mimeType || '';
        const url = asset.url;
        if (mime.startsWith('image/')) {
          createReportDto.imageUrls.push(url);
        } else if (mime.startsWith('video/')) {
          createReportDto.videoUrls.push(url);
        } else if (mime.startsWith('audio/')) {
          createReportDto.audioUrls.push(url);
        }
        createReportDto.evidenceUrls.push(url); // keep combined list for legacy
      }
    }

    const area = this.getAreaFromCoordinates(
      createReportDto.latitude,
      createReportDto.longitude,
      createReportDto.address,
    );

    // Normalize violationType / reportType
    let vType = createReportDto.violationType || createReportDto.reportType;

    // If ID is provided instead of name (common in Dashboard)
    const typeId = createReportDto.violationTypeId || createReportDto.reportTypeId;
    let reportTypeEntity: ReportTypeEntity | null = null;
    if (typeId) {
      reportTypeEntity = (await this.reportTypesService.findOne(typeId)) as any;
    } else if (vType) {
      // Find type by name if ID not provided
      const types = await this.reportTypesService.findAll();
      reportTypeEntity = (types.find(t => t.name.toLowerCase() === vType.toLowerCase())) as any;
    }

    if (reportTypeEntity) {
      vType = reportTypeEntity.name;
    }

    // Default to "Other" if still empty
    if (!vType) vType = ReportTypeEnum.OTHERS;

    // --- Hardcoded Validation Logic based on Type ---
    const lowerType = vType.toLowerCase();

    //  Noise Pollution Validation
    if (lowerType === ReportTypeEnum.NOISE.toLowerCase() || lowerType.includes("noise") || lowerType.includes("sound")) {
      let threshold = 85.0;

      if (createReportDto.noiseAreaType === NoiseAreaType.RESIDENTIAL || createReportDto.noiseAreaType === "RESIDENTIAL") {
        threshold = reportTypeEntity?.residentialDecibelThreshold ?? 45.0;
      } else if (createReportDto.noiseAreaType === NoiseAreaType.COMMERCIAL || createReportDto.noiseAreaType === "COMMERCIAL") {
        threshold = reportTypeEntity?.commercialDecibelThreshold ?? 55.0;
      }

      const userLevel = Number(createReportDto.decibelLevel || 0);
      if (userLevel < threshold) {
        throw new BadRequestException(
          `Decibel level (${userLevel} dB) is below the minimum required threshold (${threshold} dB) for a ${createReportDto.noiseAreaType || 'general'} area.`,
        );
      }

      createReportDto.noisePollutionStatus = "Pollution";
    }

    // Media Requirement Validation (General)
    // By default, we require at least one photo/video for all reports except anonymous ones
    if (!createReportDto.isAnonymous || lowerType.includes('noise')) {
      const evidenceUrls = createReportDto.evidenceUrls || [];
      const hasMedia = evidenceUrls.length > 0;

      if (!hasMedia && !lowerType.includes('noise')) {
        throw new BadRequestException(
          `At least one photo or video evidence is required for ${vType} reports.`,
        );
      }
    }

    // Default to "Other" if still empty
    if (!vType) vType = "Other";

    // Destructure to avoid passing unknown fields to Repo.create
    const {
      reportType,
      reportTypeId: rTypeId,
      violationTypeId,
      reportDescription,
      description,
      isAnonymous,
      ...cleanDto
    } = createReportDto;

    // --- Dynamic Assignment Logic ---
    let assignedPatrolId: string | null = null;
    try {
      const nearest = await this.findNearestPatrol(
        createReportDto.latitude,
        createReportDto.longitude,
      );
      if (nearest) {
        assignedPatrolId = nearest.id;
      }
    } catch (e) {
      console.warn("Auto-assignment failed:", e.message);
    }

    const report = this.reportRepo.create({
      ...cleanDto,
      caseId: `REP-${generateRandomCode(6)}`,
      reportTypeId: reportTypeEntity?.id,
      violationType: vType,
      reportDescription: reportDescription || description,
      reporterId: isAnonymous ? null : (userId || null),
      reporterPhoneNumber: isAnonymous ? null : (createReportDto.reporterPhoneNumber || null),
      imageUrls: createReportDto.imageUrls || [],
      videoUrls: createReportDto.videoUrls || [],
      audioUrls: createReportDto.audioUrls || [],
      status: assignedPatrolId ? ReportStatus.ASSIGNED : ReportStatus.SUBMITTED,
      assignedPatrolId,
      assignedAt: assignedPatrolId ? new Date() : null,
      area,
    });

    const savedReport = (await this.reportRepo.save(
      report,
    )) as unknown as Report;

    await this.logStatus(
      savedReport.id,
      ReportStatus.SUBMITTED,
      { citizenId: userId },
      `Report submitted in ${area}`,
      {
        latitude: createReportDto.latitude,
        longitude: createReportDto.longitude,
      },
    );

    // Notifications
    if (savedReport.assignedPatrolId) {
      const patrol = await this.patrolRepo.findOne({ where: { id: savedReport.assignedPatrolId } });
      this.notificationsGateway.notifyUser(savedReport.assignedPatrolId, "PATROL", {
        title: "New Case Assigned",
        message: `A new ${savedReport.violationType} report in ${area} needs your attention.`,
        type: NotificationType.REPORT_ASSIGNED,
        data: { reportId: savedReport.id, caseId: savedReport.caseId },
        fcmToken: patrol?.fcmToken,
      });
    }

    this.notificationsGateway.sendToRole("SYSTEM_ADMIN", "new_report", {
      id: savedReport.id,
      type: savedReport.violationType,
      location: savedReport.address,
      area,
      status: savedReport.status,
      timestamp: savedReport.createdAt,
    });

    await this.notifyAdmins("New Report", `A new ${savedReport.violationType} report was submitted in ${area}`, NotificationType.REPORT_SUBMITTED, { reportId: savedReport.id, caseId: savedReport.caseId });

    // ── Citizen: always notify on submission (regardless of patrol assignment) ──
    if (savedReport.reporterId) {
      const cit = await this.reportRepo.manager.getRepository("Citizen").findOne({ where: { id: savedReport.reporterId } }) as any;
      if (cit) {
        const citizenMsg = savedReport.assignedPatrolId
          ? `Your ${savedReport.violationType} report has been received and a patrol officer is being dispatched. Case: ${savedReport.caseId}`
          : `Your report has been successfully submitted. We will review it shortly. Case: ${savedReport.caseId}`;
        this.notificationsGateway.notifyUser(savedReport.reporterId, "CITIZEN", {
          title: "Report Submitted ✅",
          message: citizenMsg,
          type: NotificationType.REPORT_SUBMITTED,
          data: { reportId: savedReport.id, caseId: savedReport.caseId, status: savedReport.status },
          fcmToken: cit.fcmToken
        });
      }
    }

    return savedReport;
  }

  async findByCitizen(userId: string) {
    return this.reportRepo.find({
      where: { reporterId: userId },
      relations: ["assignedPatrol", "reportType"],
      order: { createdAt: "DESC" },
    });
  }

  async findByPatrol(patrolId: string) {
    return this.reportRepo.find({
      where: { assignedPatrolId: patrolId },
      relations: ["reporter"],
      order: { createdAt: "DESC" },
    });
  }

  async findByCaseId(caseId: string) {
    const report = await this.reportRepo.findOne({
      where: { caseId },
      relations: ["assignedPatrol", "reportType"]
    });
    if (!report) throw new NotFoundException(`Case with ID ${caseId} not found`);

    // Include history
    const history = await this.getHistory(report.id);
    return {
      ...report,
      history
    };
  }

  /**
   * Get reports near a patrol officer's office address.
   * Uses the patrol's officeLatitude/officeLongitude from the patrols table.
   */
  async findNearbyForPatrol(patrolId: string, radiusKm = 10, query?: any) {
    const patrol = await this.patrolRepo.findOne({ where: { id: patrolId } });
    if (!patrol) throw new NotFoundException("Patrol officer not found");

    // Prioritize current real-time location (latitude/longitude) over static office location
    const pLat = Number(patrol.latitude ?? patrol.officeLatitude);
    const pLng = Number(patrol.longitude ?? patrol.officeLongitude);

    if (isNaN(pLat) || isNaN(pLng)) {
      throw new BadRequestException(
        "Patrol office location is not set. Please contact your administrator to update your patrol profile.",
      );
    }

    const qb = this.reportRepo
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.reporter", "reporter")
      .leftJoinAndSelect("report.assignedPatrol", "assignedPatrol");

    if (query?.status) {
      qb.andWhere("report.status = :status", { status: query.status });
    }

    const reports = await qb.orderBy("report.createdAt", "DESC").getMany();

    const withDistance = reports
      .map((r) => ({
        ...r,
        distanceKm:
          getDistance(pLat, pLng, Number(r.latitude), Number(r.longitude)) /
          1000,
      }))
      .filter((r) => r.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      success: true,
      message: "Nearby reports retrieved successfully",
      data: {
        patrolOfficeLocation: {
          latitude: pLat,
          longitude: pLng,
          address: patrol.officeAddress || patrol.assignedArea,
        },
        radiusKm,
        total: withDistance.length,
        reports: withDistance,
      },
    };
  }

  async findNearbyPatrolsForReport(reportId: string, radiusKm = 15) {
    const report = await this.findOne(reportId);
    const activePatrols = await this.patrolRepo.find({
      where: { status: "ACTIVE" as any },
    });

    const nearby = activePatrols
      .map((p) => {
        const pLat = Number(p.latitude ?? p.officeLatitude);
        const pLon = Number(p.longitude ?? p.officeLongitude);
        if (isNaN(pLat) || isNaN(pLon)) return null;

        const distanceKm = getDistance(
          Number(report.latitude),
          Number(report.longitude),
          pLat,
          pLon,
        ) / 1000;

        return {
          ...p,
          distanceKm,
        };
      })
      .filter((p): p is any => p !== null && p.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return nearby;
  }

  async findAll(query?: any) {
    const page = Number(query?.page ?? 1);
    const limit = Number(query?.limit ?? 20);
    const skip = (page - 1) * limit;

    const qb = this.reportRepo
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.reporter", "reporter")
      .leftJoinAndSelect("report.assignedPatrol", "patrol");

    if (query?.status) {
      qb.andWhere("report.status = :status", { status: query.status });
    }
    if (query?.patrolId) {
      qb.andWhere("report.assignedPatrolId = :patrolId", {
        patrolId: query.patrolId,
      });
    }
    if (query?.violationType || query?.reportType) {
      qb.andWhere("report.violationType = :vType", {
        vType: query.violationType || query.reportType,
      });
    }
    if (query?.area) {
      qb.andWhere("report.area ILIKE :area", { area: `%${query.area}%` });
    }

    const [data, total] = await qb
      .orderBy("report.createdAt", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    let finalData: any[] = data;
    if (query?.lat && query?.lng) {
      const pLat = Number(query.lat);
      const pLng = Number(query.lng);
      finalData = data
        .map((r) => ({
          ...r,
          distance: getDistance(
            pLat,
            pLng,
            Number(r.latitude),
            Number(r.longitude),
          ),
        }))
        .sort((a: any, b: any) => a.distance - b.distance);
    }

    return {
      success: true,
      message: "Reports retrieved successfully",
      statusCode: 200,
      data: finalData,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string) {
    const report = await this.reportRepo.findOne({
      where: { id },
      relations: ["reporter", "assignedPatrol"],
    });
    if (!report) throw new NotFoundException("Report not found");
    return report;
  }

  async getHistory(id: string) {
    return await this.logRepo.find({
      where: { reportId: id },
      order: { createdAt: "ASC" },
    });
  }

  /**
   * Assign a patrol officer to a report (admin action).
   * Looks up patrol from the patrols table.
   */
  async assignPatrol(reportId: string, patrolId: string) {
    const report = await this.findOne(reportId);

    const patrol = await this.patrolRepo.findOne({ where: { id: patrolId } });
    if (!patrol) throw new NotFoundException("Patrol officer not found");

    report.assignedPatrol = patrol;
    report.assignedPatrolId = patrolId;
    report.status = ReportStatus.ASSIGNED;
    report.assignedAt = new Date();

    const saved = await this.reportRepo.save(report);
    await this.logStatus(
      reportId,
      ReportStatus.ASSIGNED,
      { patrolId: patrolId },
      `Assigned to officer ${patrol.fullName}`,
    );

    // Real-time notification for the specific Patrol Officer
    this.notificationsGateway.notifyUser(patrolId, "PATROL", {
      title: "🚨 Urgent: Case Assigned",
      message: `Case ${report.caseId} (${report.violationType || 'Environmental Violation'}) at ${report.address || 'new location'} has been assigned to you. Please respond immediately.`,
      type: NotificationType.REPORT_ASSIGNED,
      data: { reportId: report.id, caseId: report.caseId },
      fcmToken: patrol.fcmToken,
    });

    // Notify the citizen that a patrol officer has been assigned
    if (report.reporterId) {
      const citizen = await this.reportRepo.manager.getRepository("Citizen").findOne({ where: { id: report.reporterId } }) as any;
      if (citizen) {
        this.notificationsGateway.notifyUser(report.reporterId, "CITIZEN", {
          title: "Patrol Officer Assigned",
          message: `A patrol officer has been assigned to your case ${report.caseId}. Officer: ${patrol.fullName}.`,
          type: NotificationType.REPORT_STATUS_UPDATED,
          data: { reportId: report.id, caseId: report.caseId, status: ReportStatus.ASSIGNED, patrolName: patrol.fullName },
          fcmToken: citizen.fcmToken,
        });
      }
    }

    // Notify Patrol via SMS
    if (patrol.phoneNumber) {
      try {
        const recipient = normalizeEtPhone(patrol.phoneNumber);
        if (recipient) {
          await sendSMS({
            recipient,
            messageBody: `[EcoGuard] Urgent Case Assigned: ${report.address || "New location"}. Report: ${report.violationType || "Environmental Violation"}. Please check your patrol app.`,
          });
        }
      } catch (error) {
        console.error("Failed to notify patrol via SMS:", error);
      }
    }

    await this.notifyStatusChange(saved, ReportStatus.ASSIGNED, `Assigned to officer ${patrol.fullName}`);

    return saved;
  }

  async patrolAccept(reportId: string, patrolId: string) {
    const report = await this.findOne(reportId);
    if (report.assignedPatrolId !== patrolId) {
      throw new UnauthorizedException("This report is not assigned to you");
    }

    report.status = ReportStatus.IN_PROGRESS;
    report.inspectionStartedAt = new Date();

    const saved = await this.reportRepo.save(report);
    await this.logStatus(
      reportId,
      ReportStatus.IN_PROGRESS,
      { patrolId: patrolId },
      "Officer accepted the request",
    );

    // Notify Admins
    this.notificationsGateway.sendToRole("SYSTEM_ADMIN", "patrol_accepted", {
      reportId,
      caseId: report.caseId,
      patrolId,
      patrolName: report.assignedPatrol?.fullName || "Officer",
      timestamp: saved.inspectionStartedAt,
    });
    await this.notifyAdmins("Patrol Accepted", `Case ${report.caseId} accepted by ${report.assignedPatrol?.fullName || "Officer"}`, NotificationType.REPORT_STATUS_UPDATED, { reportId, caseId: report.caseId });

    // Confirm to the patrol officer that they've accepted the case
    const acceptingPatrol = await this.patrolRepo.findOne({ where: { id: patrolId } });
    if (acceptingPatrol) {
      this.notificationsGateway.notifyUser(patrolId, "PATROL", {
        title: "Case Accepted ✅",
        message: `You have successfully accepted case ${report.caseId}. Please head to the reported location and begin your inspection.`,
        type: NotificationType.REPORT_STATUS_UPDATED,
        data: { reportId, caseId: report.caseId, status: ReportStatus.IN_PROGRESS },
        fcmToken: acceptingPatrol.fcmToken,
      });
    }

    // Notify the citizen their report is now in progress
    await this.notifyStatusChange(saved, ReportStatus.IN_PROGRESS, "A patrol officer has accepted your case and is en route");

    return saved;
  }

  async patrolFollowUp(reportId: string, patrolId: string, data: any, files?: { patrolEvidence?: any[] }) {
    const report = await this.findOne(reportId);
    if (report.assignedPatrolId !== patrolId) {
      throw new UnauthorizedException("This report is not assigned to you");
    }

    if (files) {
      const savedAssets = await processUploads(
        files,
        { baseDir: "uploads", publicBase: "/", makeThumb: true },
        "reports/follow-up",
      );
      if (!data.patrolImageUrls) data.patrolImageUrls = [];
      if (!data.patrolVideoUrls) data.patrolVideoUrls = [];
      if (!data.patrolAudioUrls) data.patrolAudioUrls = [];
      if (!data.evidenceUrls) {
        data.evidenceUrls = [];
      } else if (typeof data.evidenceUrls === "string") {
        try {
          data.evidenceUrls = JSON.parse(data.evidenceUrls);
        } catch {
          data.evidenceUrls = [data.evidenceUrls];
        }
      }
      for (const asset of savedAssets) {
        const mime = asset.mimeType || '';
        const url = asset.url;
        if (mime.startsWith('image/')) {
          data.patrolImageUrls.push(url);
        } else if (mime.startsWith('video/')) {
          data.patrolVideoUrls.push(url);
        } else if (mime.startsWith('audio/')) {
          data.patrolAudioUrls.push(url);
        }
        data.evidenceUrls.push(url);
      }
    }

    // GPS Verification (50m)
    const distance = getDistance(
      Number(report.latitude),
      Number(report.longitude),
      data.latitude,
      data.longitude,
    );

    if (distance > 50) {
      throw new BadRequestException(
        `GPS verification failed. You are ${Math.round(distance)}m away from the reported location (max 50m).`,
      );
    }

    report.patrolNotes = data.notes;
    report.patrolImageUrls = data.patrolImageUrls || [];
    report.patrolVideoUrls = data.patrolVideoUrls || [];
    report.patrolAudioUrls = data.patrolAudioUrls || [];
    report.patrolEvidenceUrls = data.evidenceUrls || [];

    const saved = await this.reportRepo.save(report);
    await this.logStatus(
      reportId,
      ReportStatus.IN_PROGRESS,
      { patrolId: patrolId },
      "Patrol submitted follow-up notes and evidence",
      { latitude: data.latitude, longitude: data.longitude },
    );

    // Notify Admins
    this.notificationsGateway.sendToRole("SYSTEM_ADMIN", "patrol_follow_up", {
      reportId,
      caseId: report.caseId,
      patrolId,
      notes: data.notes,
      evidenceCount: (data.evidenceUrls || []).length,
      location: { lat: data.latitude, lng: data.longitude },
    });
    await this.notifyAdmins("Patrol Follow-up", `Notes added to Case ${report.caseId}`, NotificationType.PATROL_FOLLOW_UP, { reportId, caseId: report.caseId });

    // Notify the citizen that the patrol has submitted evidence/notes for their case
    if (report.reporterId) {
      const citizen = await this.reportRepo.manager.getRepository("Citizen").findOne({ where: { id: report.reporterId } }) as any;
      if (citizen) {
        this.notificationsGateway.notifyUser(report.reporterId, "CITIZEN", {
          title: "Case Update: Evidence Submitted",
          message: `The patrol officer has submitted inspection notes and evidence for your case ${report.caseId}. The case is under review.`,
          type: NotificationType.PATROL_FOLLOW_UP,
          data: { reportId, caseId: report.caseId, status: ReportStatus.IN_PROGRESS },
          fcmToken: citizen.fcmToken,
        });
      }
    }

    // Update patrol's current location in real-time
    await this.patrolRepo.update(patrolId, {
      latitude: data.latitude,
      longitude: data.longitude,
      lastLocationUpdate: new Date(),
    });

    return saved;
  }

  /**
   * Close/resolve a report. Allowed by the assigned patrol or any admin user.
   * adminRole is the role string from the JWT — passed by the controller.
   */
  async closeReport(reportId: string, closerId: string, closerRole: UserRole) {
    const report = await this.findOne(reportId);

    const isAdmin =
      closerRole === UserRole.SYSTEM_ADMIN ||
      closerRole === UserRole.SYSTEM_SUPER_ADMIN;
    const isAssignedPatrol = report.assignedPatrolId === closerId;

    if (!isAdmin && !isAssignedPatrol) {
      throw new UnauthorizedException(
        "You are not authorized to close this report",
      );
    }

    report.status = ReportStatus.CLOSED;
    report.inspectionCompletedAt = new Date();

    const saved = await this.reportRepo.save(report);

    const actor = isAdmin ? { userId: closerId } : { patrolId: closerId };
    await this.logStatus(
      reportId,
      ReportStatus.CLOSED,
      actor,
      "Report marked as resolved/closed",
    );

    // Notify Admins
    this.notificationsGateway.sendToRole("SYSTEM_ADMIN", "report_closed", {
      reportId,
      caseId: report.caseId,
      closedBy: closerId,
      closedAt: saved.inspectionCompletedAt,
    });
    await this.notifyAdmins("Case Closed", `Case ${report.caseId} has been closed.`, NotificationType.REPORT_STATUS_UPDATED, { reportId, caseId: report.caseId });
    await this.notifyStatusChange(saved, ReportStatus.CLOSED, "Inspection completed and case resolved.");

    return saved;
  }

  async reviewReport(
    reportId: string,
    adminId: string,
    status: ReportStatus,
    rejectionReason?: string,
  ) {
    const report = await this.findOne(reportId);

    if (
      status !== ReportStatus.UNDER_REVIEW &&
      status !== ReportStatus.REJECTED
    ) {
      throw new BadRequestException("Invalid review status");
    }

    report.status = status;
    if (rejectionReason) {
      report.rejectionReason = rejectionReason;
    }

    const saved = await this.reportRepo.save(report);
    const notes =
      status === ReportStatus.REJECTED
        ? `Evidence rejected: ${rejectionReason}`
        : "Evidence reviewed and approved";
    await this.logStatus(reportId, status, { userId: adminId }, notes);

    await this.notifyAdmins("Review Completed", `Case ${report.caseId} is now ${status}.`, NotificationType.REPORT_STATUS_UPDATED, { reportId, caseId: report.caseId });
    await this.notifyStatusChange(saved, status, notes);

    return saved;
  }

  async escalateReport(reportId: string, actorId: string, notes: string) {
    const report = await this.findOne(reportId);
    report.status = ReportStatus.ESCALATED;

    const saved = await this.reportRepo.save(report);
    await this.logStatus(
      reportId,
      ReportStatus.ESCALATED,
      { patrolId: actorId },
      notes || "Report escalated to higher authority",
    );

    await this.notifyAdmins("Case Escalated", `Case ${report.caseId} was escalated.`, NotificationType.REPORT_STATUS_UPDATED, { reportId, caseId: report.caseId });
    await this.notifyStatusChange(saved, ReportStatus.ESCALATED, notes);

    // Confirm escalation to the patrol officer
    const escalatingPatrol = await this.patrolRepo.findOne({ where: { id: actorId } });
    if (escalatingPatrol) {
      this.notificationsGateway.notifyUser(actorId, "PATROL", {
        title: "Case Escalated ⚡",
        message: `Case ${report.caseId} has been escalated to higher authority. A senior officer will take over from here.`,
        type: NotificationType.REPORT_STATUS_UPDATED,
        data: { reportId, caseId: report.caseId, status: ReportStatus.ESCALATED },
        fcmToken: escalatingPatrol.fcmToken,
      });
    }

    return saved;
  }

  async remove(reportId: string) {
    const report = await this.findOne(reportId);
    await this.logRepo.delete({ reportId });
    await this.reportRepo.remove(report);
  }

  async exportToCsv(query: any): Promise<string> {
    const result = await this.findAll(query);
    const reports = result.data;
    const header = [
      "Report ID",
      "Date",
      "Type",
      "Status",
      "Patrol",
      "Location",
      "Description",
    ].join(",");
    const rows = (reports as any[]).map((r) => {
      return [
        r.id,
        r.createdAt.toISOString(),
        r.violationType,
        r.status,
        r.assignedPatrol?.fullName || "Unassigned",
        `"${r.address?.replace(/"/g, '""') || ""}"`,
        `"${r.reportDescription?.replace(/"/g, '""') || ""}"`,
      ].join(",");
    });
    return [header, ...rows].join("\n");
  }
}
