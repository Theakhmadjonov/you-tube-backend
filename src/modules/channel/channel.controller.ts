import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { ChannelService } from './channel.service';
import { UpdateChannelDto } from './dto/update-channel.dto';


@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Get('/:username')
  async getChannel(@Param('username') username: string) {
    return await this.channelService.getChannelInfo(username);
  }

  @Get(':username/videos')
  async getChannelVideos(
    @Param('username') username: string,
    @Query('limit') limit = 20,
    @Query('page') page = 1,
    @Query('sort') sort = 'newest',
  ) {
    return await this.channelService.getChannelVideos(
      username,
      +limit,
      +page,
      sort,
    );
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'channelBanner', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/channel',
          filename: (req, file, callback) => {
            const fileExt = extname(file.originalname);
            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
            callback(null, uniqueName);
          },
        }),
      },
    ),
  )
  @Put('me')
  async updateChannel(
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      channelBanner?: Express.Multer.File[];
    },
    @Req() req: Request,
    @Body() dto: UpdateChannelDto,
  ) {
    const avatar = files?.avatar?.[0];
    const channelBanner = files?.channelBanner?.[0];
    const { id: userId, role } = req['userId'];
    console.log(dto, userId);
    return await this.channelService.updateChannel(
      userId,
      dto,
      channelBanner,
      avatar,
    );
  }

  @UseGuards(AuthGuard)
  @Get('check/channel')
  async checkChannel(@Req() req: Request) {
    console.log("bir nima");
    const { id: userId, role } = req['userId'];
    return await this.channelService.getCahnnelExists(userId);
  }
}
