import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import { User, UserRole } from '../../../entities';
import { GoogleAuthDto, AuthResponseDto } from '../dto';
import { JwtPayload } from '../strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async googleAuth(googleAuthDto: GoogleAuthDto): Promise<AuthResponseDto> {
    let googleUser: any;
    
    try {
      // Access Token으로 Google API에서 사용자 정보 가져오기
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${googleAuthDto.accessToken}`
      );
      
      if (!response.ok) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const userInfo = await response.json();
      console.log('Google User Info:', userInfo); // 디버깅용
      
      // 도메인 검증
      if (!userInfo.email?.endsWith('@grkcon.com')) {
        throw new ForbiddenException('grkcon.com 도메인 이메일만 로그인 가능합니다.');
      }

      googleUser = {
        email: userInfo.email,
        name: userInfo.name || 'Unknown User',
        googleId: userInfo.id,
        profilePicture: userInfo.picture,
      };
      console.log('Processed Google User:', googleUser); // 디버깅용
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Google token');
    }

    // 이메일 ID 기반 권한 결정 (실제 이메일 사용)
    const emailPrefix = googleUser.email.split('@')[0].toLowerCase();
    const role = ['admin', 'ceo'].includes(emailPrefix) 
      ? UserRole.ADMIN 
      : UserRole.EMPLOYEE;
    
    console.log('Email prefix:', emailPrefix);
    console.log('Assigned role:', role);

    let user = await this.userRepository.findOne({
      where: { email: googleUser.email },
    });

    let savedUser: User;

    if (!user) {
      // 실제 Google 계정 사용자 자동 생성
      const newUser = this.userRepository.create({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
        profilePicture: googleUser.profilePicture,
        role,
      });
      savedUser = await this.userRepository.save(newUser);
    } else {
      // Update last login, profile info, and role (동적 권한 변경 지원)
      user.lastLoginAt = new Date();
      user.profilePicture = googleUser.profilePicture;
      user.role = role;
      savedUser = await this.userRepository.save(user);
    }

    return this.generateAuthResponse(savedUser);
  }

  async validateUser(userId: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });
  }

  private generateAuthResponse(user: User): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    };
  }

  // Seed initial admin user for development
  async seedAdminUser(): Promise<void> {
    const adminEmail = 'admin@grkcon.com';
    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const admin = this.userRepository.create({
        email: adminEmail,
        name: 'Admin User',
        role: UserRole.ADMIN,
        googleId: 'admin-seed',
      });
      await this.userRepository.save(admin);
      console.log('Admin user created: admin@grkcon.com (Google OAuth only)');
    }
  }
}