import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { JwtModule } from '@nestjs/jwt';
import { ShortsController } from './shorts.controller';
import { ShortsService } from './shorts.service';
import { diskStorage } from 'multer';
import path from 'path';
import VideoConvertService from '../video/video_convert.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/shorts',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
          cb(null, uniqueName);
        },
      }),
    }),
    JwtModule,
  ],
  controllers: [ShortsController],
  providers: [ShortsService, VideoConvertService],
})
export class ShortsModule {}
