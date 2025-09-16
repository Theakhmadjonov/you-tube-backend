import {
  Get,
  Res,
  Post,
  Body,
  Query,
  HttpStatus,
  Controller,
  HttpException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailOtpService } from './email.service';
import { SendOtpDto } from './dto/send-otp.dto';
import VerifyOtpDto from './dto/verify.otp.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { sendCodeLoginDto, verifyCodeLoginDto } from './dto/login-auth.dto';
import { Request, Response } from 'express';
import { AuthGuard as GoogleGuard } from '@nestjs/passport';
import { AuthGuard } from 'src/common/guard/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailOtpService: EmailOtpService,
  ) {}

  @Get('google')
  @UseGuards(GoogleGuard('google'))
  googleAuthRedirect() {}

  @Get('google/callback')
  @UseGuards(GoogleGuard('google'))
  async oauthGoogleCallback(@Req() req: Request, @Res() res: Response) {
    console.log('keldi');
    const user = req['user'];
    const token = await this.authService.oauthGoogleCallback(user);
    res.cookie('token', token, {
      maxAge: 1.1 * 3600 * 1000,
      httpOnly: true,
    });
    return res.redirect('http://localhost:5173');
  }

  @Post('/log')
  async log(@Body() email: { email: string }) {
    return await this.authService.log(email.email);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Req() req: Request) {
    console.log('mega keldi');
    const { id, role } = req['userId'];
    return await this.authService.getMe(id);
  }

  @Post('send-otp')
  async sendOtpUser(@Body() sendOtpDto: SendOtpDto) {
    const response = await this.authService.sendOtpUser(sendOtpDto);
    return response;
  }

  @Post('verify-otp')
  async verifyOtp(@Body() data: VerifyOtpDto) {
    return await this.authService.verifyOtp(data);
  }

  @Post('register')
  async register(
    @Body() createAuthDto: CreateAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.register(createAuthDto);
    res.cookie('token', token, {
      maxAge: 1.1 * 3600 * 1000,
      httpOnly: true,
    });
    return token;
  }

  @Post('send-code-login')
  async sendCodeLogin(@Body() data: sendCodeLoginDto) {
    try {
      const response = await this.authService.sendCodeLogin(data);
      return response;
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('verify-login')
  async verifyLogin(
    @Body() data: verifyCodeLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const token = await this.authService.verifyCodeLogin(data);
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 1.1 * 3600 * 1000,
      });
      return { token };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('send-email-link')
  async sendEmailLink(@Body('email') email: string) {
    try {
      const token = await this.emailOtpService.sendEmailLink(email);
      return {
        message: 'Email successfully sended',
        token,
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new HttpException('Token topilmadi', HttpStatus.BAD_REQUEST);
    }

    const data = await this.emailOtpService.getEmailToken(token);
    if (!data) {
      throw new HttpException('Token expired', HttpStatus.BAD_REQUEST);
    }

    return JSON.parse(data);
  }
}
