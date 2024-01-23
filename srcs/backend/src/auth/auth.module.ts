import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { FtStrategy } from './ft/ft.strategy';
import { FtAuthGuard } from './ft/ft.guard';
import { FtSerializer } from './ft/ft.serializer';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    PassportModule.register({ session: true }),
    SmsModule,
  ],
  controllers: [AuthController],
  providers: [FtStrategy, FtAuthGuard, FtSerializer],
})
export class AuthModule {}
