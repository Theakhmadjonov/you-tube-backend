import { Injectable } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private db: PrismaService) {}
  async getAllUserSubscriptions(userId: string) {
    const subscriptions = await this.db.subscription.findMany({
      where: {
        subscriberId: userId,
      },
      include: {
        channel: true,
        subscriber: true,
      },
    });
    return subscriptions;
  }

  findAll() {
    return `This action returns all subscription`;
  }

  findOne(id: number) {
    return `This action returns a #${id} subscription`;
  }

  update(id: number, updateSubscriptionDto: UpdateSubscriptionDto) {
    return `This action updates a #${id} subscription`;
  }

  remove(id: number) {
    return `This action removes a #${id} subscription`;
  }
}
