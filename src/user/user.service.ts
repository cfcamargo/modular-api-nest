import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusEnum } from 'src/utils/enums/StatusEnum';
import { v4 as uuidV4 } from 'uuid';
import { MailService } from 'src/mail/mail.service';
import { UserRequestDTO } from './dto/user-request.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prismaService.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException('E-mail já está em uso');
    }

    const activationKey = uuidV4();

    try {
      const result = await this.prismaService.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            ...createUserDto,
            activationKey,
            status: StatusEnum.PENDING,
          },
        });

        await this.mailService.sendAccountActivation(
          user.fullName,
          user.email,
          activationKey,
        );

        return user;
      });

      return {
        statusCode: 201,
        message: 'Usuário criado com sucesso!',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao criar usuário: ' + error.message,
      );
    }
  }

  async findAll(request: UserRequestDTO) {
    const { page = 1, perPage = 20, searchTerm } = request;
    const skip = (Number(page) - 1) * Number(perPage);

    const where: Prisma.UserWhereInput = {};

    if (searchTerm) {
      where.fullName = {
        contains: searchTerm,
        mode: 'insensitive',
      };
    }

    const [data, total] = await Promise.all([
      this.prismaService.user.findMany({
        where,
        skip,
        take: Number(perPage),
      }),

      this.prismaService.user.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      perPage,
      lastPage: Math.ceil(total / perPage),
    };
  }

  async findOne(id: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException();
    }

    return {
      user,
    };
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
