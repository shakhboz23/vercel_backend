import { RoleService } from '../role/role.service';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { Subscription_activityService } from './subscription_activity.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionActivityDto } from './dto/subscription_activity.dto';

@ApiTags('Subscription_activity')
@Controller('subscription_activity')
export class Subscription_activityController {
  constructor(
    private readonly subscription_activityService: Subscription_activityService,
    private readonly roleService: RoleService,
  ) {}

  @ApiOperation({ summary: 'Registration a new subscription_activity' })
  @Post('create')
  async create(@Body() subscriptionActivityDto: SubscriptionActivityDto) {
    const data = await this.subscription_activityService.create(
      subscriptionActivityDto,
    );
    return data;
  }

  @ApiOperation({ summary: 'Get all subscription_activitys' })
  @Get('getByRole')
  getAll() {
    return this.subscription_activityService.getAll();
  }

  @ApiOperation({ summary: 'Get subscription_activity by ID' })
  @Get(':id')
  getById(@Param('id') id: number) {
    return this.subscription_activityService.getById(id);
  }
}
