import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerFile from '../swagger-output.json';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import routes from './routes';


const app = express();

dotenv.config();

const PORT = process.env.PORT || 4000;

app.use(cors({
    credentials: true,
    origin: true,
}));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/', routes());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get("/api-docs.json", (req, res) => {
  res.json(swaggerFile);
});


const server = http.createServer(app);

const io = new Server(server , {
    cors: {
        credentials: true,
        origin: true,
    },
});


io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);

  socket.on('chat message', (msg) => {
    console.log('پیام دریافت شد:', msg);
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});