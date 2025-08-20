import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MoviesModule } from './movies/movies.module';
import { TheatersModule } from './theaters/theaters.module';
import { CinemasModule } from './cinemas/cinemas.module';
import { ShowtimesModule } from './showtimes/showtimes.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { PointsTransactionsModule } from './points-transaction/points_transaction.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    UsersModule,
    MoviesModule,
    TheatersModule,
    CinemasModule,
    ShowtimesModule,
    BookingsModule,
    PaymentsModule,
    PointsTransactionsModule,
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}