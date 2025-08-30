import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App E2E', () => {
  let app: INestApplication;
  let server: any;
  let accessToken: string;
  let bookingId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('/auth/register (POST) - success', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe('test@example.com');
    });

    it('/auth/login (POST) - success', async () => {
      const res = await request(server)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      accessToken = res.body.access_token;
    });

    it('/auth/profile (GET) - authorized', async () => {
      const res = await request(server)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('Movies', () => {
    it('/movies/coming-soon (GET)', async () => {
      const res = await request(server).get('/movies/coming-soon').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('/movies/genres (GET)', async () => {
      const res = await request(server).get('/movies/genres').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
  describe('Cinemas', () => {
    it('/cinemas/theater/:theaterId (GET)', async () => {
      const res = await request(server).get('/cinemas/theater/1').expect(200);
      expect(res.body).toHaveProperty('id');
    });

    it('/cinemas/:id/available-seats (GET)', async () => {
      const res = await request(server)
        .get('/cinemas/1/available-seats')
        .query({ showtimeId: 1 })
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Bookings', () => {
    it('/bookings (POST) - create', async () => {
      const res = await request(server)
        .post('/bookings')
        .send({
          userId: 1,
          showtimeId: 1,
          seats: [1, 2],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      bookingId = res.body.id;
    });

    it('/bookings (GET) - list', async () => {
      const res = await request(server).get('/bookings').expect(200);
      expect(res.body).toHaveProperty('data');
    });

    it('/bookings/:id (GET)', async () => {
      const res = await request(server).get(`/bookings/${bookingId}`).expect(200);
      expect(res.body).toHaveProperty('id', bookingId);
    });

    it('/bookings/:id (PUT) - update', async () => {
      const res = await request(server)
        .put(`/bookings/${bookingId}`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(res.body).toHaveProperty('status', 'confirmed');
    });

    it('/bookings/:id/cancel (PUT)', async () => {
      const res = await request(server)
        .put(`/bookings/${bookingId}/cancel`)
        .expect(200);

      expect(res.body).toHaveProperty('status', 'cancelled');
    });
  });
});
