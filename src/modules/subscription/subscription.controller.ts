import {
  Controller,
  Post,
  Req
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('all')
  async getUserSubscriptions(@Req() req: Request) {
    const { id: userId, role } = req['userId'];
    return this.subscriptionService.getAllUserSubscriptions(userId);
  }
}
