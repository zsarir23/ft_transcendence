import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UseGuards,
  Res,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { UpdateChatDto } from './dto/update-chat.dto';
import { User } from 'src/common/decorators/user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CreateChatDto } from './dto/create-chat.dto';
import { UserType } from 'src/common/interfaces/user.interface';
import { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ConversationDto } from './dto/chat.dto';
import { ConversationType } from '@prisma/client';

// TODO: ? maybe return ConversationDto for all methods

@ApiTags('chat')
@ApiForbiddenResponse({ description: 'Forbidden' })
@UseGuards(AuthGuard)
@UseGuards(RolesGuard)
@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiBody({ type: CreateChatDto })
  @ApiCreatedResponse({ description: 'Chat created' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiOperation({ summary: 'Create a chat' })
  @Post()
  async create(@User() user: UserType, @Body() createChatDto: CreateChatDto) {
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (createChatDto.type != 'DM') {
      createChatDto.ownerId = user.id;
    }

    return this.chatService.create(createChatDto);
  }

  @ApiOperation({
    summary: 'Find all chats for the logged in user',
  })
  @ApiOkResponse({ type: [ConversationDto] })
  @Get()
  find(@User() user: UserType) {
    return this.chatService.findAllChatForUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    console.log('ChatController.findOne id:', id);
    return this.chatService.findOne(id);
  }

  @ApiParam({ description: 'Chat id', name: 'id', type: Number })
  @ApiOkResponse({ type: ConversationDto })
  @ApiOperation({ summary: 'Update a chat' })
  @Roles(Role.OWNER)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChatDto: UpdateChatDto,
  ) {
    return this.chatService.update(+id, updateChatDto);
  }

  @ApiParam({ description: 'Chat id', name: 'id', type: Number })
  @ApiOkResponse({ type: ConversationDto })
  @ApiOperation({ summary: 'Remove a chat' })
  @Roles(Role.OWNER)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.remove(+id);
  }

  // TODO: Test this
  @ApiParam({ description: 'Chat id', name: 'id', type: Number })
  @ApiBody({ type: UpdateChatDto })
  @ApiOkResponse({ type: ConversationDto })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiOperation({ summary: 'Find a chat by id' })
  @Post(':id/participants/add')
  addParticipant(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.chatService.addParticipant(+id, +userId);
  }

  @Roles(Role.OWNER, Role.ADMIN)
  @Delete(':id/participants/remove')
  removeParticipant(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.chatService.removeParticipant(+id, +userId);
  }

  @Roles(Role.OWNER, Role.ADMIN)
  @Post(':id/admins/add')
  addAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.chatService.addAdmin(+id, +userId);
  }

  @Roles(Role.OWNER, Role.ADMIN)
  @Delete(':id/admins/remove')
  removeAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.chatService.removeAdmin(+id, +userId);
  }

  @Post(':id/leave')
  leaveChat(@Param('id', ParseIntPipe) id: number, @User() user: UserType) {
    return this.chatService.leaveChat(+id, user.id);
  }

  @Roles(Role.OWNER, Role.ADMIN)
  @Post(':id/ban')
  async ban(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    const chat = await this.chatService.findOne(+id);

    if (chat.ownerId === +userId) {
      throw new ForbiddenException('You cannot ban the owner of the chat');
    }

    const admins = chat.admins.map((admin) => admin.id);
    if (admins.includes(+userId)) {
      return this.chatService.ban(+id, +userId, Role.ADMIN);
    }

    return this.chatService.ban(+id, +userId, Role.USER);
  }

  @Roles(Role.OWNER, Role.ADMIN)
  @Post(':id/unban')
  unban(@Param('id', ParseIntPipe) id: number, @Body('userId') userId: string) {
    return this.chatService.unban(+id, +userId);
  }

  @Roles(Role.OWNER, Role.ADMIN)
  @Post(':id/mute')
  async mute(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId: string; duration: number },
  ) {
    const { userId, duration } = body;

    const chat = await this.chatService.findOne(+id);
    if (chat.ownerId === +userId) {
      throw new ForbiddenException('You cannot mute the owner of the chat');
    }

    return this.chatService.mute(+id, +userId, +duration);
  }

  @Roles(Role.OWNER, Role.ADMIN)
  @Post(':id/unmute')
  unmute(
    @Param('id', ParseIntPipe)
    id: number,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.chatService.unmute(id, userId);
  }

  @Get(':id/muted')
  findMuted(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.findMuted(+id);
  }

  @Get(':id/avatar')
  async getAvatar(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const avatar = await this.chatService.getAvatar(+id);

    if (avatar && avatar.startsWith('http')) {
      return res.redirect(avatar);
    }

    return res.sendFile(avatar, { root: './' });
  }

  @Get(':id/messages')
  findMessages(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.findMessages(+id);
  }

  @Get(':id/participants')
  findParticipants(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.findParticipants(+id);
  }

  @Get(':id/admins')
  findAdmins(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.findAdmins(+id);
  }

  @Get(':id/owner')
  findOwner(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.findOwner(+id);
  }

  @Get(':id/chats')
  getUserChats(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.getUserChats(id);
  }

  @Get('names')
  getChatNames() {
    console.log('Getting chat names in ChatController');
    return this.chatService.getChatNames();
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular chats' })
  @ApiOkResponse({
    description: 'Gets the top 4 popular channels',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          type: { enum: ['DM', 'PUBLIC', 'PRIVATE', 'PROTECTED'] },
          name: { type: 'string' },
          image: { type: 'string' },
          _count: {
            type: 'object',
            properties: {
              participants: { type: 'number' },
              admins: { type: 'number' },
            },
          },
        },
      },
    },
  })
  getPopularChats() {
    return this.chatService.getPopularChats();
  }
}
