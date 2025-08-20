import { Test, TestingModule } from '@nestjs/testing';
import { PointsTransactionService } from './points_transaction.service';

describe('PointsTransactionService', () => {
  let service: PointsTransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointsTransactionService],
    }).compile();

    service = module.get<PointsTransactionService>(PointsTransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
