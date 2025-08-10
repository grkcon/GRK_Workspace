import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../entities';

export class GoogleAuthDto {
  @ApiProperty({
    example: 'google_oauth_access_token',
    description: 'Google OAuth access token',
  })
  @IsString()
  accessToken: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  user: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    profilePicture?: string;
  };
}
