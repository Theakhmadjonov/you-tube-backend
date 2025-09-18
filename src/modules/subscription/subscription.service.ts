import { Injectable } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private db: PrismaService) {}
  async getAllUserSubscriptions(userId: string) {
    const subscriptions = await this.db.subscription.findMany({
      where: { subscriberId: userId },
      select: { channelId: true },
    });

    if (!subscriptions.length) return [];

    // 2. Channel bo‘yicha videos va shorts olish
    const result = await Promise.all(
      subscriptions.map(async (sub) => {
        const [videos, shorts] = await Promise.all([
          this.db.video.findMany({
            where: { authorId: sub.channelId, visibility: 'PUBLIC' },
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  channelName: true,
                  avatar: true,
                },
              },
            },
          }),
          this.db.shorts.findMany({
            where: { authorId: sub.channelId, visibility: 'PUBLIC' },
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  channelName: true,
                  avatar: true,
                },
              },
            },
          }),
        ]);

        return {
          channelId: sub.channelId,
          videos,
          shorts,
        };
      }),
    );

    return result;
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
