import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from './env.config';

let io: Server | null = null;

/**
 * Attaches Socket.IO to the HTTP server and configures its connection policy.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: env.clientUrl || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Lắng nghe sự kiện tham gia phòng (rooms)
    socket.on('join', (room: string) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // Lắng nghe sự kiện rời phòng
    socket.on('leave', (room: string) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Returns the initialized Socket.IO instance or fails if startup is incomplete.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

/**
 * Publishes a real-time event to one authorized application room.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const emitToRoom = (room: string, event: string, data: any) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

/**
 * Publishes an event to all currently connected clients.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const emitGlobal = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};
/**
 * Centralizes configuration and initialization for this external infrastructure integration.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
