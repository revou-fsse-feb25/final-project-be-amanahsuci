import { Test, TestingModule } from '@nestjs/testing';
import { PointsTransactionController } from './points_transaction.controller';
import { PointsTransactionService } from './points_transaction.service';

describe('PointsTransactionController', () => {
  let controller: PointsTransactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointsTransactionController],
      providers: [PointsTransactionService],
    }).compile();

    controller = module.get<PointsTransactionController>(PointsTransactionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
