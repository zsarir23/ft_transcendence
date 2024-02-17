import {
  Controller,
  Get,
  Query,
  Logger,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FriendRequestsService } from './requests.service';
import { User } from 'src/common/decorators/user.decorator';
import { UserType } from 'src/common/interfaces/user.interface';
import { QueryDto } from 'src/users/dto/query.dto';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RequestDto } from './dto/request.dto';
import { Gateway } from 'src/gateway/gateway';

@ApiTags('friend-requests')
@ApiForbiddenResponse({ description: 'Forbidden' })
@UseGuards(AuthGuard)
@Controller()
export class FriendRequestsController {
  private readonly logger = new Logger(FriendRequestsController.name);

  constructor(
    private readonly friendRequestsService: FriendRequestsService,
    private readonly gateway: Gateway,
  ) {}

  @ApiQuery({
    name: 'id',
    type: Number,
    required: true,
    description: 'User ID',
  })
  @ApiOkResponse({ description: 'Friend request sent' })
  @ApiBadRequestResponse({
    description:
      'Bad request, either users are already friends or the request is pending',
  })
  @ApiOperation({
    summary: 'Send a friend request to another user',
  })
  @Get('send')
  async sendFriendRequest(
    @Query('id', ParseIntPipe) id: number,
    @User() user: UserType,
  ) {
    const senderId = user?.id;
    const receiverId = id;

    this.logger.log(
      `User <${senderId}> is adding user ${receiverId} as a friend`,
    );

    return this.friendRequestsService.sendFriendRequest(senderId, receiverId);
  }

  @ApiQuery({
    name: 'id',
    type: Number,
    required: true,
    description: 'User ID',
  })
  @ApiOkResponse({ description: 'Friend request accepted' })
  @ApiNotFoundResponse({ description: 'Friend request not found' })
  @ApiBadRequestResponse({ description: 'Friend request is not pending' })
  @ApiOperation({
    summary: 'Accept a friend request from another user',
  })
  @Get('accept')
  async acceptFriendRequest(
    @Query('id', ParseIntPipe) id: number,
    @User() user: UserType,
  ) {
    const senderId = id; // because the user is accepting the request from the sender
    const receiverId = user?.id;

    this.logger.log(
      `User <${receiverId}> is accepting a friend request from user <${senderId}>`,
    );

    return this.friendRequestsService.acceptFriendRequest(receiverId, senderId);
  }

  @ApiQuery({
    name: 'id',
    type: Number,
    required: true,
    description: 'User ID',
  })
  @ApiOkResponse({ description: 'Friend request declined' })
  @ApiNotFoundResponse({ description: 'Friend request not found' })
  @ApiOperation({
    summary: 'Decline a friend request from another user',
  })
  @Get('decline')
  async declineFriendRequest(
    @Query('id', ParseIntPipe) id: number,
    @User() user: UserType,
  ) {
    const senderId = id;
    const receiverId = user?.id;

    this.logger.log(
      `User <${senderId}> is declining a friend request from user <${receiverId}>`,
    );

    return this.friendRequestsService.declineFriendRequest(
      receiverId,
      senderId,
    );
  }

  @ApiOkResponse({
    type: [RequestDto],
    description: 'Friend request cancelled',
  })
  @ApiOperation({
    summary: 'List sent friend requests',
  })
  @Get('sent')
  async listSentFriendRequests(@User() user: UserType) {
    this.logger.log(`Listing sent friend requests for user <${user?.id}>`);
    return this.friendRequestsService.listSentFriendRequests(user.id);
  }

  @ApiOkResponse({
    type: [RequestDto],
    description: 'Friend request cancelled',
  })
  @ApiOperation({
    summary: 'List received friend requests',
  })
  @Get('received')
  async listReceivedFriendRequests(@User() user: UserType) {
    this.logger.log(`Listing received friend requests for user <${user?.id}>`);
    return this.friendRequestsService.listReceivedFriendRequests(user.id);
  }

  @ApiQuery({
    name: 'id',
    type: Number,
    required: true,
    description: 'User ID',
  })
  @ApiOkResponse({ description: 'Friend request cancelled' })
  @ApiNotFoundResponse({ description: 'Friend request not found' })
  @ApiOperation({
    summary: 'Cancel a friend request sent to another user',
  })
  @Get('cancel')
  async cancelFriendRequest(
    @Query('id', ParseIntPipe) id: number,
    @User() user: UserType,
  ) {
    const receiverId = id;
    const senderId = user?.id;

    this.logger.log(
      `User <${senderId}> is cancelling a friend request to user <${receiverId}>`,
    );

    const request = await this.friendRequestsService.cancelFriendRequest(
      senderId,
      receiverId,
    );

    if (request) {
      this.gateway.server.emit('friend-request-cancelled', {
        senderId,
        receiverId,
        requestId: request.id,
      });
    }

    return request;
  }
}
