import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  SetMetadata,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { CreateVideoDto } from './dto/create-video.dto';
import { VideoService } from './video.service';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @UseGuards(AuthGuard, RoleGuard)
  @SetMetadata('roles', ['USER'])
  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'poster', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, callback) => {
            const fileExt = extname(file.originalname);
            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
            callback(null, uniqueName);
          },
        }),
      },
    ),
  )
  async upload(
    @UploadedFiles()
    files: {
      video?: Express.Multer.File[];
      poster?: Express.Multer.File[];
    },
    @Req() req: string,
    @Body() data: CreateVideoDto,
  ) {
    const videoFile = files?.video?.[0];
    const posterFile = files?.poster?.[0];
    if (!videoFile) {
      throw new BadRequestException('Videofile not found');
    }
    const userId = req['userId'].id;
    return this.videoService.uploadVideo(videoFile, posterFile, userId, data);
  }

  @Get('watch/:id')
  async watch(
    @Param('id') id: string,
    @Query('quality') quality: string,
    @Res() res: Response,
    @Req() req,
  ) {
    const range = req.headers.range || '';
    return this.videoService.watchVideo(id, quality || '720', range, res);
  }

  @Get('video/:id')
  async getVideoDetail(@Param('id') id: string) {
    return await this.videoService.getVideoDetail(id);
  }

  @Get('all')
  async getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('category') category: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.videoService.getAllVideos(pageNum, limitNum, category);
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    return this.videoService.getVideoStatus(id);
  }

  @Put(':id')
  async updateVideo(
    @Param('id') id: string,
    @Req() req,
    @Body() body: any,
  ) {
    return this.videoService.updateVideo(id, req.user.id, body);
  }
  @Delete(':id')
  async deleteVideo(@Param('id') id: string, @Req() req) {
    return this.videoService.deleteVideo(id, req.user.id);
  }

  @Get('feed')
  async getFeed(@Query() query: any) {
    return this.videoService.getVideoFeed(query);
  }

  @Get('search')
  async search(
    @Query('q') q: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.videoService.searchVideos(
      q,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('trending')
  async trending(
    @Query('category') category: string,
    @Query('region') region: string,
    @Query('timeframe') timeframe: string,
  ) {
    return this.videoService.getTrendingVideos(
      category || 'all',
      region || 'global',
      timeframe || '24h',
    );
  }

  @UseGuards(AuthGuard)
  @Post(':id/like')
  async likeVideo(@Param('id') id: string, @Req() req: Request) {
    console.log("keeeeelid");
    const { id: userId, role } = req['userId'];
    console.log(userId);
    return this.videoService.likeVideo(id, userId);
  }

  @UseGuards(AuthGuard)
  @Post(':id/dislike')
  async dislikeVideo(@Param('id') id: string, @Req() req: Request) {
    const { id: userId, role } = req['userId'];
    return this.videoService.dislikeVideo(id, userId);
  }

  @UseGuards(AuthGuard)
  @Delete(':id/like')
  async removeLikeVideo(@Param('id') id: string, @Req() req: Request) {
    const { id: userId, role } = req['userId'];
    return this.videoService.removeLikeVideo(id, userId);
  }
}
