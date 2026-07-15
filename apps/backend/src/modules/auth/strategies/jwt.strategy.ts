import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../user/entities/user.entity";
import { Patrol } from "../../patrol/entities/patrol.entity";
import { Citizen } from "../../citizen/entities/citizen.entity";
import { UserRole, UserStatus } from "../../../common/enums/enums";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Patrol)
    private readonly patrolRepository: Repository<Patrol>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: any) {
    const { sub, role } = payload;

    if (role === UserRole.PATROL) {
      const patrol = await this.patrolRepository.findOne({
        where: { id: sub, status: UserStatus.ACTIVE },
      });
      if (!patrol)
        throw new UnauthorizedException("Patrol officer not found or inactive");
      return { id: patrol.id, role: UserRole.PATROL };
    }

    if (role === UserRole.CITIZEN) {
      const citizen = await this.citizenRepository.findOne({
        where: { id: sub, status: UserStatus.ACTIVE },
      });
      if (!citizen)
        throw new UnauthorizedException("Citizen not found or inactive");
      return { id: citizen.id, role: UserRole.CITIZEN };
    }

    // Admin / System users → look in the users table
    const user = await this.userRepository.findOne({
      where: { id: sub, status: UserStatus.ACTIVE },
    });
    if (!user) throw new UnauthorizedException("User not found or inactive");
    return { id: user.id, role: user.role };
  }
}
