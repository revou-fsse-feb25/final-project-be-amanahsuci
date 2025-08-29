import { Module } from '@nestjs/common';
import { PointsTransactionsService } from './points_transaction.service';
import { PointsTransactionsController } from './points_transaction.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PointsTransactionsController],
  providers: [PointsTransactionsService],
  exports: [PointsTransactionsService],
})
export class PointsTransactionsModule {}