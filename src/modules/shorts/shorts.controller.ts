import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  SetMetadata,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { ShortsService } from './shorts.service';
import { CreateShortsDto } from './dto/create-short.dto';
import { Response } from 'express';

@Controller('shorts')
export class ShortsController {
  constructor(private readonly shortsService: ShortsService) {}

  @UseGuards(AuthGuard)
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
          destination: './uploads/shorts',
          filename: (req, file, callback) => {
            const fileExt = extname(file.originalname);
            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
            callback(null, uniqueName);
          },
        }),
      },
    ),
  )
  async uploadShort(
    @UploadedFiles()
    files: {
      video?: Express.Multer.File[];
      poster?: Express.Multer.File[];
    },
    @Req() req: string,
    @Body() data: CreateShortsDto,
  ) {
    const videoFile = files?.video?.[0];
    const posterFile = files?.poster?.[0];

    if (!videoFile) {
      throw new BadRequestException('Video fayl topilmadi');
    }
    const userId = req['userId'].id;
    return this.shortsService.uploadShort(videoFile, posterFile, userId, data);
  }

  @Get('watch/:id')
  async watch(@Param('id') id: string, @Res() res: Response, @Req() req) {
    console.log(id, "keldi");
    const range = req.headers.range || '';

    return this.shortsService.watchShort(id, range, res);
  }

  @Get('short/:id')
  async getVideoDetail(@Param('id') id: string) {
    return await this.shortsService.getShortdetail(id);
  }

  @Get('all')
  async getAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '4',
    @Query('category') category: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return await this.shortsService.getAllShorts(pageNum, limitNum, category);
  }
}
