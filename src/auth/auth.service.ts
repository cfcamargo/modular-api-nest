import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BcryptService } from './hashing/bcrypt.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly brcryptService: BcryptService,
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
        issuer: 'Modular - Login',
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

    const passwordIsValid = await this.brcryptService.compare(
      userPassword,
      user.password!,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Credencias incorretas.');
    }

    const { password, ...data } = user;
    const accessToken = this.createToken(user);

    return {
      accessToken,
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
}
