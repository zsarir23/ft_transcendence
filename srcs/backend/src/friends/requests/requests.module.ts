import { Module } from '@nestjs/common';
import { FriendRequestsService } from './requests.service';
import { FriendRequestsController } from './requests.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [FriendRequestsController],
  providers: [FriendRequestsService],
})
export class FriendRequestsModule {}
