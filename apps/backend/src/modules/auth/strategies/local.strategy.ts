import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../user/entities/user.entity";
import { comparePassword } from "../../../common/utils/password.util";
import { UserStatus } from "../../../common/enums/enums";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: [{ email: username }, { phoneNumber: username }],
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("User is not active");
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
