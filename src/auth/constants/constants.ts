export const jwtConstants = {
    secret: process.env.JWT_SECRET || 'movie-ticket-booking-secret-key',
    expiresIn: '1h',
}