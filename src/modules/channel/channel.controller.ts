import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  UseGuards,
  Post,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Request } from 'express';

@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Get('/:username')
  async getChannel(@Param('username') username: string) {
    // console.log(username);
    return this.channelService.getChannelInfo(username);
  }

  @Get(':username/videos')
  async getChannelVideos(
    @Param('username') username: string,
    @Query('limit') limit = 20,
    @Query('page') page = 1,
    @Query('sort') sort = 'newest',
  ) {
    return this.channelService.getChannelVideos(username, +limit, +page, sort);
  }

  @UseGuards(AuthGuard)
  @Put('me')
  async updateChannel(@Req() req: Request, @Body() dto: UpdateChannelDto) {
    const { id: userId, role } = req['userId'];
    return this.channelService.updateChannel(userId, dto);
  }

  @UseGuards(AuthGuard)
  @Post('/subscribe/:authorId')
  async subscribe(@Req() req: Request, @Param('authorId') auhtorId: string) {
    const { id: userId, role } = req['userId'];
    console.log(userId, auhtorId, 'shuu');
    console.log('subs');
    return this.channelService.subscribe(userId, auhtorId);
  }

  @UseGuards(AuthGuard)
  @Delete('/subscribe/:authorId')
  async unsubscribe(@Req() req: Request, @Param('authorId') authorId: string) {
    const { id: userId, role } = req['userId'];
    console.log('unsubs');
    return this.channelService.unsubscribe(userId, authorId);
  }

  @UseGuards(AuthGuard)
  @Get('/subscribe/:authorId')
  async checkSubscribe(
    @Req() req: Request,
    @Param('authorId') authorId: string,
  ) {
    const { id: userId, role } = req['userId'];
    console.log('chechksubs');
    return this.channelService.checkSubscribe(userId, authorId);
  }

  @UseGuards(AuthGuard)
  @Get('subscriptions')
  async getSubscriptions(
    @Req() req: Request,
    @Query('limit') limit = 20,
    @Query('page') page = 1,
  ) {
    const { id: userId, role } = req['userId'];
    return this.channelService.getSubscriptions(userId, +limit, +page);
  }

  @UseGuards(AuthGuard)
  @Get('subscriptions/feed')
  async getSubscriptionFeed(
    @Req() req: Request,
    @Query('limit') limit = 20,
    @Query('page') page = 1,
  ) {
    const { id: userId, role } = req['userId'];
    return this.channelService.getSubscriptionFeed(userId, +limit, +page);
  }
}
