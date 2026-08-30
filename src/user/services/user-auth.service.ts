import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName, User } from '../models/user.models';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from '../dto/register.dto';
import { generateToken } from '../../common/utils/token';
import { LoginUserDto } from '../dto/login.dto';
import { Op } from 'sequelize';
import { RoleService } from '../../role/role.service';
import { RoleDto } from '../../role/dto/role.dto';
import { Role } from '../../role/models/role.models';
import { CheckDto } from '../../role/dto/check.dto';
import { hash } from 'bcrypt';
import * as uuid from 'uuid';
import * as bcrypt from 'bcrypt';
import { NewPasswordDto } from '../dto/new-password.dto';
import { OAuth2Client } from 'google-auth-library';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { PhoneUserDto } from '../dto/email.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ChangeUserEmailDto } from '../dto/change-email.dto';
import { validateTelegramInitData } from 'src/common/utils/webAppInitData';
import { Bot } from 'src/bot/models/bot.model';

// Registration, login, password/email flows, Google/OAuth verification and
// current-role switching. Extracted out of UserService, which keeps thin
// delegating wrappers so callers don't change.
@Injectable()
export class UserAuthService {
  constructor(
    @InjectModel(User) private userRepository: typeof User,
    private readonly jwtService: JwtService,
    private readonly roleService: RoleService,
  ) {}

  async register(registerUserDto: RegisterUserDto, type?: string) {
    try {
      let is_new_role = false;
      let { phone, role, password } = registerUserDto;
      phone = phone || null;
      const hashed_password: string = await hash(password, 7);
      let user = await this.userRepository.findOne({
        where: { [Op.or]: { phone } },
      });
      let is_role: any;
      if (user) {
        is_role = await this.roleService.getUserRoles(user.id, role);
        if (is_role.data?.length) {
          throw new BadRequestException('Already registered');
        } else {
          is_new_role = true;
        }
      }
      const current_role: string = registerUserDto.role;
      if (is_new_role) {
        const roleData: RoleDto = {
          ...registerUserDto,
          user_id: user.id,
        };
        await this.roleService.create(roleData);
        user = await this.userRepository.findByPk(user.id);
        await this.updateCurrentRole(user.id, current_role);
        const { access_token, refresh_token } = await generateToken(
          { id: user.id },
          this.jwtService,
        );

        const user_data: any = await this.userRepository.findByPk(user.id, {
          include: { model: Role },
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Successfully registered1!',
          data: user_data,
          token: access_token,
        };
      } else {
        const student_id = await this.generateUniqueStudentId();
        user = await this.userRepository.create({
          ...registerUserDto,
          hashed_password,
          student_id,
        });
        const { access_token, refresh_token } = await generateToken(
          { id: user.id, is_active: user.is_active },
          this.jwtService,
        );
        const hashed_refresh_token = await hash(refresh_token, 7);

        const uniqueKey: string = uuid.v4();

        const updateuser = await this.userRepository.update(
          {
            hashed_refresh_token: hashed_refresh_token,
            activation_link: uniqueKey,
          },
          { where: { id: user.id }, returning: true },
        );

        const roleData: RoleDto = {
          ...registerUserDto,
          user_id: user.id,
        };
        await this.roleService.create(roleData);
        await this.updateCurrentRole(user.id, current_role);

        const user_data: any = await this.userRepository.findByPk(user.id, {
          include: { model: Role },
          attributes: {
            exclude: [
              'activation_link',
              'hashed_password',
              'is_active',
              'hashed_refresh_token',
              '',
            ],
          },
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Verification code sended successfully',
          data: user_data,
          token: access_token,
        };
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createUsers(names: any[]) {
    const user_list: any = [];
    const users = names.map(async (name) => {
      const password = this.generateRandomPassword();
      name = name.split(' ');
      user_list.push({
        login: name[0] + password.slice(0, 2) + '@gmail.com',
        password,
        user: name.join(' '),
      });
      await this.register({
        name: name[0],
        surname: name[1],
        password,
        role: RoleName.student,
      });
    });
    return user_list;
  }

  private generateRandomPassword(): string {
    const chars = '0123456789';
    let password = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }
    return password;
  }

  private async generateUniqueStudentId(): Promise<string> {
    let student_id: string;
    let exists: User | null;
    do {
      student_id = String(Math.floor(1000 + Math.random() * 9000));
      exists = await this.userRepository.findOne({ where: { student_id } });
    } while (exists);
    return student_id;
  }

  async activateLink(activation_link: string) {
    if (!activation_link) {
      throw new BadRequestException('Activation link not found');
    }
    const user = await this.userRepository.findOne({
      where: { activation_link },
    });
    if (!user) {
      throw new BadRequestException('Activation link not found');
    } else if (user?.is_active) {
      throw new BadRequestException('User already activated');
    }
    const updateduser = await this.userRepository.update(
      { is_active: true, activation_link: '' },
      { where: { activation_link }, returning: true },
    );
    const { access_token, refresh_token } = await generateToken(
      { id: user.id },
      this.jwtService,
    );
    return {
      message: 'User activated successfully',
      user: updateduser[1][0],
      token: access_token,
    };
  }

  async login(loginUserDto: LoginUserDto, type?: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { phone: loginUserDto.phone },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (type != 'googleauth') {
        const isMatchPass = await bcrypt.compare(
          loginUserDto.password,
          user.hashed_password,
        );
        if (!isMatchPass) {
          throw new BadRequestException('Password did not match!');
        }
      }

      if (!user.is_active) {
        const uniqueKey: string = uuid.v4();

        const updateuser = await this.userRepository.update(
          {
            activation_link: uniqueKey,
          },
          { where: { id: user.id }, returning: true },
        );

        return {
          statusCode: HttpStatus.OK,
          message: 'Verification code sended successfully',
          user,
        };
      }

      const { access_token, refresh_token } = await generateToken(
        { id: user.id },
        this.jwtService,
      );
      return {
        statusCode: HttpStatus.OK,
        mesage: 'Logged in successfully',
        user,
        token: access_token,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getWebAppUser(initData: any) {
    const isValid = validateTelegramInitData(initData, process.env.BOT_TOKEN);

    if (!isValid) {
      throw new NotFoundException('User not found!');
    }

    const params = new URLSearchParams(initData);
    const bot_id = JSON.parse(params.get('user'))?.id;
    const user: any = await this.userRepository.findOne({
      include: {
        model: Bot,
        where: { bot_id },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const { access_token, refresh_token } = await generateToken(
      { id: user.id },
      this.jwtService,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Successfully registered1!',
      data: user,
      token: access_token,
    };
  }

  // checkEmail/newPassword/changeEmail/googleAuth: kept as no-ops (their
  // implementations were already fully commented out before this file was
  // split out of user.service.ts) so behavior is unchanged.
  async checkEmail(email: string) {}

  async checkPassword(checkDto: CheckDto) {
    const res: any = await this.roleService.checkPassword(checkDto);
    if (res) {
      const user: any = await this.updateCurrentRole(
        res.data.id,
        res.data.role,
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: user.data,
      };
    }
  }

  async newPassword(newPasswordDto: NewPasswordDto) {}

  async updatePassword(password: string, phone: string) {
    try {
      const hashed_password = await hash(password, 7);
      const updated_info = await this.userRepository.update(
        { hashed_password },
        { where: { phone }, returning: true },
      );
      return updated_info[1][0];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async changeEmail(user_id: number, changeUserEmailDto: ChangeUserEmailDto) {}

  async forgotPassword(phoneUserDto: PhoneUserDto) {
    try {
      const { phone } = phoneUserDto;
      const activation_link: string = uuid.v4();

      const updated_info = await this.userRepository.update(
        { activation_link },
        { where: { phone }, returning: true },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Emailingizga link yuborildi',
        data: {
          user: updated_info[1][0],
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async resetPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const { activation_link, new_password } = forgotPasswordDto;
      const user = await this.userRepository.findOne({
        where: { activation_link },
      });
      const hashed_password = await hash(new_password, 7);
      const updated_info = await this.userRepository.update(
        { hashed_password },
        { where: { phone: user.phone }, returning: true },
      );
      return {
        message: "Paroli o'zgartirildi",
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async changePassword(user_id: number, changePasswordDto: ChangePasswordDto) {
    try {
      const { old_password, new_password } = changePasswordDto;
      const user = await this.userRepository.findByPk(user_id);
      const isMatchPass = await bcrypt.compare(
        changePasswordDto.old_password,
        user.hashed_password,
      );
      if (!isMatchPass) {
        throw new BadRequestException('Password did not match!');
      }
      const hashed_password = await hash(new_password, 7);
      await this.userRepository.update(
        { hashed_password },
        { where: { phone: user.phone }, returning: true },
      );
      return {
        message: "Parolingiz o'zgartirildi",
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateCurrentRole(id: number, current_role: string) {
    try {
      const user = await this.userRepository.findByPk(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const update = await this.userRepository.update(
        { current_role },
        {
          where: { id },
          returning: true,
        },
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'Updated successfully',
        data: update[1][0],
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verify(token: string, type?: string) {
    let ticket: any;
    if (type == 'mobile') {
      const client = new OAuth2Client(process.env.FLUTTER_CLIENT_ID);
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.FLUTTER_CLIENT_ID,
      });
    } else if (type == 'desktop') {
      const client = new OAuth2Client(process.env.DESKTOP_CLIENT_ID);
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.DESKTOP_CLIENT_ID,
      });
    } else {
      const client = new OAuth2Client(process.env.CLIENT_ID);
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID,
      });
    }
    const payload: any = ticket.getPayload();
    return payload;
  }

  async googleAuth(credential: string, type?: string) {}

  async createDefaultUser() {
    try {
      await this.register({
        name: process.env.INITIAL_NAME,
        surname: process.env.INITIAL_SURNAME,
        password: process.env.INITIAL_PASSWORD,
        role: RoleName.super_admin,
      });
    } catch {}
  }
}
