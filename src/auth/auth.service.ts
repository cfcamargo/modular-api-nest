import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthRegisterDTO } from './dto/auth.register.dto';
import * as bcrypt from 'bcrypt';
import { StatusEnum } from 'src/utils/enums/StatusEnum';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  createToken(user: User) {
    return this.jwtService.sign(
      {
        name: user.fullName,
        email: user.email,
      },
      {
        expiresIn: '7 days',
        subject: String(user.id),
        issuer: 'LyraAPP - Login',
        audience: 'users',
      },
    );
  }

  checkToken(token: string) {
    try {
      const data = this.jwtService.verify(token, {});
      return data;
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  isValidToken(token) {
    try {
      this.checkToken(token);
      return true;
    } catch (e) {
      return false;
    }
  }

  async login(email: string, userPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credencias incorretas.');
    }

    const passwordIsValid = await bcrypt.compare(userPassword, user.password);

    if (!passwordIsValid) {
      throw new UnauthorizedException('Credencias incorretas.');
    }

    const { password, ...data } = user;
    const acessToken = this.createToken(user);

    return {
      acessToken,
      user: data,
    };
  }

  async forgetPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email incorretas.');
    }

    // TODO: enviar o email
    return true;
  }

  async resetPassword(password: string, token: string) {
    //TODO: validar o token,

    const id = '0';

    const user = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password,
      },
    });

    return this.createToken(user);
  }

  async register(data: AuthRegisterDTO) {
    const { email, fullName, password } = data;

    try {
      const salt = await bcrypt.genSalt();

      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await this.prisma.user.create({
        data: {
          email,
          fullName,
          password: hashedPassword,
          status: StatusEnum.PENDING,
        },
      });

      return this.createToken(user);
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);

      throw new Error('Erro ao registrar usuário. Tente novamente.');
    }
  }

  async verifyEmailAlreadyExists(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (user) {
      return true;
    }

    return false;
  }
}
