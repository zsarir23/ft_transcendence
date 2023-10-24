import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { User, FriendshipStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService, // private readonly prisma: PrismaService, //TODO: Change it to friendRequestService (maybe?)
  ) {}

  async listFriendsByIdentifier(id: string | number): Promise<User[]> {
    const user: User =
      typeof id === 'string'
        ? await this.usersService.findByUsername(id)
        : await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException(`User with identifier <${id}> not found`);
    }

    const acceptedFriendRequests = await this.prisma.friendRequest.findMany({
      where: {
        OR: [
          {
            senderId: { equals: user.id },
            friendshipStatus: FriendshipStatus.ACCEPTED,
          },
          {
            receiverId: { equals: user.id },
            friendshipStatus: FriendshipStatus.ACCEPTED,
          },
        ],
      },
    });

    if (!acceptedFriendRequests) {
      return [];
    }

    const friendIds = acceptedFriendRequests.map((friendRequest) => {
      return friendRequest.senderId === user.id
        ? friendRequest.receiverId
        : friendRequest.senderId;
    });

    const friends = await this.prisma.user.findMany({
      where: { id: { in: friendIds } },
    });

    return friends;
  }

  async sendFriendRequest(senderId: number, receiverUsername: string) {
    this.logger.log(
      `Friend request from <${senderId}> to <${receiverUsername}>`,
    );
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });

    if (!sender) {
      throw new NotFoundException(`User with id <${senderId}> not found`);
    }

    const receiver = await this.prisma.user.findUnique({
      where: { username: receiverUsername },
    });

    if (!receiver) {
      throw new NotFoundException(`User <${receiverUsername}> not found`);
    }

    const request = await this.prisma.friendRequest.upsert({
      where: {
        senderId_receiverId: { senderId, receiverId: receiver.id },
      },
      update: {
        friendshipStatus: FriendshipStatus.PENDING,
      },
      create: {
        senderId: senderId,
        receiverId: receiver.id,
        friendshipStatus: FriendshipStatus.PENDING,
      },
    });

    return { message: 'Friend request sent', request };
  }

  async acceptFriendRequest(receiverId: number, senderUsername: string) {
    const sender = await this.prisma.user.findUnique({
      where: { username: senderUsername },
    });

    if (!sender) {
      throw new NotFoundException(`User ${senderUsername} not found`);
    }

    this.logger.log({
      receiverId,
      senderUsername,
    });

    const friendRequest = await this.prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: { senderId: sender.id, receiverId },
      },
    });

    if (!friendRequest) {
      throw new NotFoundException(
        `Friend request from <${sender.id}> to <${receiverId}> not found`,
      );
    }

    if (friendRequest.friendshipStatus !== FriendshipStatus.PENDING) {
      throw new BadRequestException(
        `Friend request from <${sender.id}> to <${receiverId}> is not pending`,
      );
    }

    const request = await this.prisma.friendRequest.update({
      where: {
        senderId_receiverId: { senderId: sender.id, receiverId },
      },
      data: {
        friendshipStatus: FriendshipStatus.ACCEPTED,
      },
    });

    return { message: 'Friend request accepted', request };
  }

  async declineFriendRequest(receiverId: number, senderUsername: string) {
    this.logger.log(
      `Rejecting friend request from <${senderUsername}> to <${receiverId}>`,
    );
    const sender = await this.prisma.user.findUnique({
      where: { username: senderUsername },
    });

    if (!sender) {
      throw new NotFoundException(`User <${senderUsername}> not found`);
    }

    const friendRequest = await this.prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: { senderId: sender.id, receiverId },
      },
    });

    if (!friendRequest) {
      throw new NotFoundException(
        `Friend request from <${senderUsername}> to <${receiverId}> not found`,
      );
    }

    if (friendRequest.friendshipStatus !== FriendshipStatus.PENDING) {
      throw new BadRequestException(
        `Friend request from <${senderUsername}> to <${receiverId}> not found`,
      );
    }

    // TODO: can't accept a friend request that was already accepted

    const request = await this.prisma.friendRequest.update({
      where: {
        senderId_receiverId: { senderId: sender.id, receiverId },
      },
      data: {
        friendshipStatus: FriendshipStatus.DECLINED,
      },
    });

    // TODO: delete friend request if declined

    return { message: 'Friend request rejected', request };
  }
  // async listRequests(username: string) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { username: username },
  //   });

  //   if (!user) {
  //     throw new NotFoundException(`User with username <${username}> not found`);
  //   }

  //   const friendRequests = await this.prisma.friendRequest.findMany({
  //     where: {
  //       OR: [
  //         {
  //           senderId: { equals: user.id },
  //           friendshipStatus: FriendshipStatus.PENDING,
  //         },
  //         {
  //           receiverId: { equals: user.id },
  //           friendshipStatus: FriendshipStatus.PENDING,
  //         },
  //       ],
  //     },
  //   });

  //   if (!friendRequests) {
  //     return [];
  //   }

  //   const friendIds = friendRequests.map((friendRequest) => {
  //     return friendRequest.senderId === user.id
  //       ? friendRequest.receiverId
  //       : friendRequest.senderId;
  //   });

  //   const friends = await this.prisma.user.findMany({
  //     where: { id: { in: friendIds } },
  //   });

  //   return friends;
  // }

  // async removeFriend(userId: number, friendUsername: string) {
  //   this.logger.log(
  //     `Removing friend <${friendUsername}> from user <${userId}>`,
  //   );

  //   const friend = await this.prisma.user.findUnique({
  //     where: { username: friendUsername },
  //   });

  //   if (!friend) {
  //     throw new NotFoundException(`User <${friendUsername}> not found`);
  //   }

  //   console.log({
  //     friend,
  //   });

  //   const friendRequests = await this.prisma.friendRequest.deleteMany({
  //     where: {
  //       OR: [
  //         {
  //           senderId: { equals: userId },
  //           friendshipStatus: FriendshipStatus.ACCEPTED,
  //         },
  //         {
  //           receiverId: { equals: userId },
  //           friendshipStatus: FriendshipStatus.ACCEPTED,
  //         },
  //       ],
  //     },
  //   });

  //   return { message: 'Friend removed', friendRequests };
  // }
}
