import express, { Application } from 'express';
import cors from 'cors';
import 'dotenv/config';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

import adminRouter from './routes/adminRouter';
import participantRouter from './routes/participantRouter';
import { mongoUrl, PORT } from './constants';

const app: Application = express();

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(mongoUrl);

app.use('/admin', adminRouter);
app.use('/participant', participantRouter);

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
