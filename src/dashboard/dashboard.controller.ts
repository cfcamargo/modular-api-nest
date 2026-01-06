import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GetDashboardDto } from './dto/get-dashboard.dto';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboardData(@Query() query: GetDashboardDto) {
    return this.dashboardService.getDashboardData(query);
  }
}
