import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async seedAll() {
    await this.seedUsers();
  }

  async seedUsers() {
    const username = this.configService.get('SP_USERNAME')as string;
    const email = this.configService.get('SP_EMAIL')as string;
    const password = this.configService.get('SP_PASSWORD') as string;
    const phoneNumber = this.configService.get('SP_PHONE') as string;
    const firstName = this.configService.get('SP_FIRSTNAME') || 'Super' as string;
    const lastName = this.configService.get('SP_LASTNAME') || 'Admin' as string;
    const passwordHash = await bcrypt.hash(password, 12);

    const findExistsAdmin = await this.prisma.user.findFirst({
      where: { username },
    });

    if (!findExistsAdmin) {
      await this.prisma.user.create({
        data: {
          firstName,
          lastName,
          username,
          phone_number: phoneNumber,
          email,
          password: passwordHash,
          role: Role.SUPERADMIN,
        },
      });
      this.logger.log('superadmin created successfully');
    } else {
      this.logger.warn('Superadmin existed!!');
    }
  }

  async onModuleInit() {
    try {
      await this.seedAll();
    } catch (error) {
      this.logger.error(error);
    }
  }
}
