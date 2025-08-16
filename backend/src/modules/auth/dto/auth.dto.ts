import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../entities';

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