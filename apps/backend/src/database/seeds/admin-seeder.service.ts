import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { User } from "../../modules/user/entities/user.entity";
import { UserRole, UserStatus } from "../../common/enums/enums";

@Injectable()
export class AdminSeederService implements OnApplicationBootstrap {
  constructor(private dataSource: DataSource) { }

  async onApplicationBootstrap() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }

    const userRepo: Repository<User> = this.dataSource.getRepository(User);
    const adminPhone = process.env.SEED_ADMIN_PHONE ?? "+251900000000";

    const existingAdmin = await userRepo.findOne({
      where: { phoneNumber: adminPhone, role: UserRole.SYSTEM_SUPER_ADMIN },
    });

    if (existingAdmin) {
      console.log(
        "• Admin user already exists with correct details — skipping",
      );
      return;
    }

    const admin = userRepo.create({
      fullName: "System Super Admin",
      phoneNumber: adminPhone,
      email: (
        process.env.SEED_ADMIN_EMAIL ?? "admin@example.com"
      ).toLowerCase(),
      role: UserRole.SYSTEM_SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isStaffUser: true,
      isPasswordSet: false,
      isPhoneVerified: true,
      isEmailVerified: true,
      userCode: await this.generateUserCode(userRepo),
    });
    await userRepo.save(admin);
    console.log("✔ Seeded admin user");
  }

  async generateUserCode(userRepo: Repository<User>): Promise<string> {
    const lastUser = await userRepo.findOne({
      order: { createdAt: "DESC" },
      where: {},
    });


    let nextNum = 1;
    if (lastUser && lastUser.userCode) {
      const parts = lastUser.userCode.split("-");
      if (parts.length > 1 && !isNaN(Number(parts[1]))) {
        nextNum = Number(parts[1]) + 1;
      }
    }
    return `USR-${String(nextNum).padStart(4, "0")}`;
  }

}
