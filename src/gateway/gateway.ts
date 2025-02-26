import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*', credentials: true } })
export class ChatGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // Initialization logic
  afterInit() {
    console.log('WebSocket gateway initialized');
  }

  // Handling client disconnection
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
