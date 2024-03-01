import { UsersService } from 'src/users/users.service';
import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Request } from 'express';

@Injectable()
export class FtStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(FtStrategy.name);

  constructor(private readonly usersService: UsersService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      passReqToCallback: true,
      Scope: ['profile', 'email'],
    });
  }

  async validate(
    request: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    // TODO: Get these information from the Google API
    const { username } = profile;
    const email = profile.emails[0].value;
    const url = process.env.FT_PROFILE_URL + username;

    try {
      return await this.usersService.findByEmail(email);
    } catch (error) {
      const avatar = await this.usersService.getAvatarFrom42API(
        'https://api.intra.42.fr/v2/me',
        accessToken,
      );

      const user = await this.usersService.create({
        email,
        username,
        url,
        avatar,
      });

      return {
        ...user,
        isNew: true,
      };
    }
  }
}
