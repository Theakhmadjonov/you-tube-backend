import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ResendModule } from 'nestjs-resend';
import { SeederModule } from './database/seeders/seeders.module';

@Module({
  imports: [
    DatabaseModule,
    SeederModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.getOrThrow('JWT_KEY'),
          signOptions: { expiresIn: '30d' },
        };
      },
    }),
    ResendModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        apiKey: configService.getOrThrow('RESEND_API_KEY') as string,
      }),
    }),
  ],
  exports: [DatabaseModule, JwtModule],
})
export class CoreModule {}
