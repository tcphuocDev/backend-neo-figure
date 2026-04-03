import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    // Check if user is updating their own profile or is admin
    if (req.user.userId !== id && req.user.role !== 'admin') {
      throw new UnauthorizedException(
        'You can only update your own profile',
      );
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Put(':id/password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req,
  ) {
    // Check if user is updating their own password
    if (req.user.userId !== id) {
      throw new UnauthorizedException(
        'You can only change your own password',
      );
    }
    return this.usersService.changePassword(id, changePasswordDto);
  }
}
