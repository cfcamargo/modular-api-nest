import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRequestDTO } from './dto/user-request.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateByResetCodeDto } from './dto/update-by-reset-code.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    console.log('Create User DTO:', createUserDto);
    return this.userService.create(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Query() request: UserRequestDTO) {
    return this.userService.findAll(request);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  @Get('/reset-password/:activationKey')
  resetPassword(@Param('activationKey') activationKey: string) {
    return this.userService.findByResetCode(activationKey);
  }

  @Patch('/reset-password')
  updateByResetCode(@Body() updateByResetCodeDto: UpdateByResetCodeDto) {
    console.log('Update By Reset Code DTO:', updateByResetCodeDto);
    return this.userService.updateByResetCode(updateByResetCodeDto);
  }
}
