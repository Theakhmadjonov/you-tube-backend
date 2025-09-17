import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { CreateShortsDto } from './dto/create-short.dto';
import VideoConvertService from '../video/video_convert.service';
import { Response } from 'express';

@Injectable()
export class ShortsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly videoService: VideoConvertService,
  ) {}

  async getDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata: any) => {
        if (err) return reject(err);
        resolve(Math.floor(metadata.format.duration));
      });
    });
  }

  async uploadShort(
    videoFile: Express.Multer.File,
    posterFile: Express.Multer.File | undefined,
    userId: string,
    { title, description, category }: CreateShortsDto,
  ) {
    if (!userId) throw new BadRequestException('Foydalanuvchi aniqlanmadi');
    if (!videoFile) throw new BadRequestException('Video fayl yuborilmadi');

    const fileName = videoFile.filename;
    const videoPath = path.join(process.cwd(), 'uploads', 'shorts', fileName);
    console.log(videoPath);
    const duration = await this.getDuration(videoPath);
    if (duration > 300) {
      fs.unlinkSync(videoPath);
      throw new BadRequestException('Shorts 300 sekunddan oshmasligi kerak');
    }

    let posterUrl: string;
    if (posterFile) {
      posterUrl = `/uploads/shorts/${posterFile.filename}`;
    } else {
      const posterFolder = path.join(process.cwd(), 'uploads', 'shorts');
      fs.mkdirSync(posterFolder, { recursive: true });

      const posterFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .screenshots({
            timestamps: ['50%'],
            filename: posterFileName,
            folder: posterFolder,
            size: '640x?',
          });
      });

      posterUrl = `/uploads/shorts/${posterFileName}`;
    }
    const finalShortUrl = `/uploads/shorts/${fileName.split('.')[0]}`;
    const newShort = await this.prisma.shorts.create({
      data: {
        title,
        description,
        videoUrl: finalShortUrl,
        posterUrl,
        duration,
        category,
        author: { connect: { id: userId } },
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
    });

    return { message: 'Short successfully uploaded', newShort };
  }

  async watchShort(id: string, range: string, res: Response) {
    const videoPath = path.join(process.cwd(), 'uploads', 'shorts', id);
    if (!fs.existsSync(videoPath)) {
      throw new NotFoundException('Video file not found on server');
    }
    const { size } = fs.statSync(videoPath);
    if (!range) {
      range = `bytes=0-262143`;
    }
    const { start, end, chunkSize } = this.videoService.getChunkProps(
      range,
      size,
    );
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
    videoStream.on('error', (err) => {
      console.error('Stream error:', err);
      res.sendStatus(500);
    });
  }

  async getShortdetail(videoId: string) {
    
  }
}
