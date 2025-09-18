import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionService } from './subscription.service';
import { AuthGuard } from 'src/common/guard/auth.guard';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @UseGuards(AuthGuard)
  @Get('all')
  async getUserSubscriptions(@Req() req: Request) {
    const { id: userId, role } = req['userId'];
    console.log('keldi');
    const data = await this.subscriptionService.getAllUserSubscriptions(userId);
    console.log(data);
    return data;
  }
}



