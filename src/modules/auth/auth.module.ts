import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/core/database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailOtpService } from './email.service';
import { OtpSecurityService } from './otp.security.service';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    SmsService,
    OtpSecurityService,
    EmailOtpService,
  ],
  exports: [],
})
export class AuthModule {}
