import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientService } from './client.service';
import { ClientRequestDTO } from './dto/client-request.dto';
import { CreateClientDto } from './dto/create-client.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  findAll(@Query() request: ClientRequestDTO) {
    return this.clientService.findAll(request);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientService.findOne(id);
  }

  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Delete(':id')
  destroy(@Param('id') id: string) {
    return this.clientService.remove(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClientDto: CreateClientDto) {
    return this.clientService.update(id, updateClientDto);
  }
}
