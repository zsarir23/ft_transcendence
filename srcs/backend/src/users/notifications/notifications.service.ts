import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { UserType } from 'src/common/interfaces/user.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private readonly infoToSelect = {
    id: true,
    read: true,
    type: true,
    sender: {
      select: {
        id: true,
        username: true,
        avatar: true,
      },
    },
  };

  constructor(private readonly prismaService: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    return this.prismaService.notification.create({
      data: createNotificationDto,
    });
  }

  findByQuery(user: UserType, query: UpdateNotificationDto) {
    if (Object.keys(query).length) {
      return this.prismaService.notification.findMany({
        where: query,
        select: this.infoToSelect,
      });
    }

    return this.findAllByReceiverId(user.id);
  }

  update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return this.prismaService.notification.update({
      where: { id },
      data: updateNotificationDto,
    });
  }

  findOne(id: number) {
    return this.prismaService.notification.findUniqueOrThrow({
      where: { id },
      select: this.infoToSelect,
    });
  }

  remove(id: number) {
    return this.prismaService.notification.delete({
      where: { id },
    });
  }

  async findAllByReceiverId(receiverId: number) {
    return this.prismaService.notification.findMany({
      where: { receiverId },
      select: this.infoToSelect,
    });
  }
}
