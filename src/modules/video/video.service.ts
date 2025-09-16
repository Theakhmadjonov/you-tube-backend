import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import VideoConvertService from './video_convert.service';
import ffmpeg from 'fluent-ffmpeg';
import { CreateVideoDto } from './dto/create-video.dto';
import { Category, Prisma } from '@prisma/client';

@Injectable()
export class VideoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly videoService: VideoConvertService,
  ) {}

  async uploadVideo(
    videoFile: Express.Multer.File,
    posterFile: Express.Multer.File | undefined,
    userId: string,
    { title, description, category }: CreateVideoDto,
  ) {
    if (!userId) throw new Error('Foydalanuvchi aniqlanmadi');
    if (!videoFile) throw new Error('Video fayl yuborilmadi');
    const fileName = videoFile.filename;
    const videoPath = path.join(process.cwd(), 'uploads', fileName);

    const resolution: any =
      await this.videoService.getVideoResolution(videoPath);
    const duration = await this.videoService.getDuration(videoPath);

    const resolutions = [
      { height: 240 },
      { height: 360 },
      { height: 480 },
      { height: 720 },
      { height: 1080 },
    ];

    const validResolutions = resolutions.filter(
      (r) => r.height <= resolution.height + 6,
    );

    if (validResolutions.length === 0) {
      fs.unlinkSync(videoPath);
      return { message: 'Video past sifatli' };
    }

    const folderPath = path.join(
      process.cwd(),
      'uploads',
      'videos',
      fileName.split('.')[0],
    );

    fs.mkdirSync(folderPath, { recursive: true });

    let posterUrl: string;
    if (posterFile) {
      posterUrl = `/uploads/posters/${posterFile.filename}`;
    } else {
      const posterFolder = path.join(process.cwd(), 'uploads', 'posters');
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

      posterUrl = `/uploads/posters/${posterFileName}`;
    }

    await Promise.all(
      this.videoService.convertToResolutions(
        videoPath,
        folderPath,
        validResolutions,
      ),
    );

    fs.unlinkSync(videoPath);

    const finalVideoUrl = `/uploads/videos/${fileName.split('.')[0]}/720p.mp4`;

    const newVideo = await this.prisma.video.create({
      data: {
        title,
        description,
        videoUrl: finalVideoUrl,
        posterUrl,
        duration,
        category,
        author: {
          connect: { id: userId },
        },
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
    });

    return { message: 'Video muvaffaqiyatli yuklandi', newVideo };
  }

  // async getAllVideos(page: number, limit: number, category: string) {
  //   const skip = (page - 1) * limit;
  //   const [videos, total] = await this.prisma.$transaction([
  //     this.prisma.video.findMany({
  //       skip,
  //       take: limit,
  //       orderBy: { createdAt: 'desc' },
  //       include: {
  //         author: {
  //           select: {
  //             username: true,
  //             channelName: true,
  //             channelBanner: true,
  //             channelDescription: true,
  //             comments: true,
  //             createdAt: true,
  //             email: true,
  //             firstName: true,
  //             id: true,
  //             lastName: true,
  //             likes: true,
  //             phone_number: true,
  //             notifications: true,
  //           },
  //         },
  //       },
  //     }),
  //     this.prisma.video.count(),
  //   ]);

  //   const totalPages = Math.ceil(total / limit);

  //   return {
  //     data: videos,
  //     pagination: {
  //       total,
  //       page,
  //       limit,
  //       totalPages,
  //       hasNextPage: page < totalPages,
  //       hasPrevPage: page > 1,
  //     },
  //   };
  // }

  async getAllVideos(page: number, limit: number, category: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.VideoWhereInput =
      category && category !== 'all' ? { category: category as Category } : {};

    const [videos, total] = await this.prisma.$transaction([
      this.prisma.video.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phone_number: true,
              channelName: true,
              channelBanner: true,
              channelDescription: true,
              comments: true,
              likes: true,
              notifications: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.video.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: videos,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async watchVideo(id: string, quality: string, range: string, res: Response) {
    const baseQuality = `${quality}p.mp4`;
    const videoPath = path.join(
      process.cwd(),
      'uploads',
      'videos',
      id,
      baseQuality,
    );
    if (!fs.existsSync(videoPath)) {
      throw new NotFoundException('Video file not found on server');
    }
    const { size } = fs.statSync(videoPath);
    if (!range) {
      range = `bytes=0-1048575`;
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

  async getVideoDetail(id: string) {
    const data = await this.prisma.video.findFirst({
      where: {
        id,
      },
      include: {
        author: {
          select: {
            subscribers: true,
            channelBanner: true,
            channelDescription: true,
            channelName: true,
            firstName: true,
            avatar: true,
            id: true,
          },
        },
        likes: true,
      },
    });
    await this.prisma.video.update({
      where: { id },
      data: {
        viewsCount: { increment: 1 },
      },
    });
    return data;
  }

  async getVideoStatus(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        status: true,
        videoUrl: true,
      },
    });

    if (!video) {
      throw new NotFoundException('Video topilmadi');
    }

    return {
      success: true,
      data: {
        id: video.id,
        status: video.status,
        processingProgress: video.status === 'PUBLISHED' ? 100 : 65,
        availableQualities: ['720p'],
        estimatedTimeRemaining:
          video.status === 'PUBLISHED' ? '0 minutes' : '2-5 minutes',
      },
    };
  }

  async updateVideo(videoId: string, userId: string, body: any) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video || video.authorId !== userId) {
      throw new NotFoundException('Video topilmadi yoki ruxsat yo‘q');
    }

    await this.prisma.video.update({
      where: { id: videoId },
      data: {
        title: body.title,
        description: body.description,
        visibility: body.visibility,
      },
    });

    return { message: 'Video yangilandi' };
  }
  async deleteVideo(videoId: string, userId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video || video.authorId !== userId) {
      throw new NotFoundException("Video topilmadi yoki ruxsat yo'q");
    }

    await this.prisma.video.delete({ where: { id: videoId } });

    return { message: "Video o'chirildi" };
  }

  async getVideoFeed(query: any) {
    const { page = 1, limit = 20, category, duration, sort } = query;
    const skip = (page - 1) * limit;

    let whereClause: any = { visibility: 'PUBLIC' };

    if (category) whereClause.category = category;

    const orderBy: any = {};

    if (sort === 'popular') orderBy.viewsCount = 'desc';
    else if (sort === 'newest') orderBy.createdAt = 'desc';
    else if (sort === 'oldest') orderBy.createdAt = 'asc';

    const videos = await this.prisma.video.findMany({
      where: whereClause,
      take: Number(limit),
      skip,
      orderBy,
    });

    return { success: true, data: videos };
  }

  async searchVideos(query: string, page = 1, limit = 20) {
    const videos = await this.prisma.video.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        visibility: 'PUBLIC',
      },
      take: Number(limit),
      skip: (page - 1) * limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data: videos };
  }

  async getTrendingVideos(category: string, region: string, timeframe: string) {
    const videos = await this.prisma.video.findMany({
      where: {
        visibility: 'PUBLIC',
      },
      take: 20,
      orderBy: {
        viewsCount: 'desc',
      },
    });

    return { success: true, data: videos };
  }

  async likeVideo(videoId: string, userId: string) {
    await this.prisma.like.deleteMany({
      where: { videoId, userId, type: 'DISLIKE' },
    });
    const existing = await this.prisma.like.findUnique({
      where: {
        userId_videoId_type: {
          userId,
          videoId,
          type: 'LIKE',
        },
      },
    });

    if (existing) return existing;
    return this.prisma.like.create({
      data: {
        userId,
        videoId,
        type: 'LIKE',
      },
    });
  }

  async dislikeVideo(videoId: string, userId: string) {
    await this.prisma.like.deleteMany({
      where: { videoId, userId, type: 'LIKE' },
    });

    const existing = await this.prisma.like.findUnique({
      where: {
        userId_videoId_type: {
          userId,
          videoId,
          type: 'DISLIKE',
        },
      },
    });

    if (existing) return existing;

    return this.prisma.like.create({
      data: {
        userId,
        videoId,
        type: 'DISLIKE',
      },
    });
  }

  async removeLikeVideo(videoId: string, userId: string) {
    return this.prisma.like.deleteMany({
      where: { videoId, userId },
    });
  }
}
