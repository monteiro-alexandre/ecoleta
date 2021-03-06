import express from 'express';

import { errors } from 'celebrate';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import routes from './routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);

app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.use(errors());

export { app };
