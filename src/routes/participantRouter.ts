import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Events, { IEvent } from '../models/events';
import Participants, { IParticipant } from '../models/participants';
import { jwtSecret } from '../constants';

const router = express.Router();

router.get('/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const date = new Date();
    const events: IEvent[] = await Events.find({ start: { $gte: date } });
    res.json(events);
  } catch (e) {
    res.status(500).json({ msg: `Error: ${e}` });
  }
});

router.get('/event', async (req: Request, res: Response): Promise<Response> => {
  try {
    const event: IEvent[] = await Events.find({ _id: req.body.id });
    return res.json(event);
  } catch (e) {
    return res.status(500).json({ msg: `Error: ${e}` });
  }
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { uname, pass }: { uname: string; pass: string } = req.body;
  const usr = await Participants.findOne({ uname: req.body.uname });
  if (usr) {
    res.status(409).json({ msg: 'User already exists!' });
    return;
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(pass, salt);
  try {
    await Participants.create({
      uname,
      pass: hashedPassword,
    });
    res.status(200).json({ msg: 'Registration Was Successful' });
  } catch (e) {
    res.status(500).json({ msg: `Error: ${e}` });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  let validPassword = false;
  try {
    const usr = await Participants.findOne({ uname: req.body.uname });
    if (usr) {
      validPassword = await bcrypt.compare(req.body.pass, usr.pass);
    }
    if (validPassword) {
      const token = jwt.sign({ uname: req.body.uname }, `${jwtSecret}`, { expiresIn: '1d' });
      if (!token) {
        res.json({ code: 0, msg: 'Invalid Token' });
        // console.log('Issue with JWT creation');
        return;
      }
      res.send(token);
    } else {
      res.json({ code: 0, msg: 'Forbidden' });
      // console.log(`Unauthorized User tried to access /admin, Uname: ${req.body.uname} Pwd: ${req.body.password}`);
      return;
    }
  } catch (e) {
    //  console.log(`Error in route (/participant/login): ${e}`);
    res.status(500).json({ msg: `Error: ${e}` });
  }
});

router.post('/regevent', async (req: Request, res: Response): Promise<void> => {
  const eventId = req.body.id;
  const token = req.body.jwt;
  const now = new Date();
  const event = <IEvent> await Events.findOne({ _id: eventId });
  if (event.registeredParticipants === event.maxParticipants) {
    res.json({ msg: 'Event has already reached maximum number of participants!' });
    return;
  }
  // eslint-disable-next-line
  if (now > event.start) {
    res.json({ msg: 'The event has already started, cannot register for it now.' });
    return;
  }
  try {
    const tempData = jwt.verify(token, jwtSecret);
    const data = JSON.parse(JSON.stringify(tempData));
    const usr = <IParticipant> await Participants.findOne({ uname: data.uname });
    let clashFlag = 0;
    await Promise.all(
      usr.events.map(async (eve: string) => {
        const arr = eve.split('-');
        const e = <IEvent> await Events.findOne({ _id: arr[0] });
        const bo = (e.start <= event.start && event.start <= e.end) || (e.start <= event.start && event.end <= e.end);
        if (bo) clashFlag = 1;
      }),
    );
    if (clashFlag !== 1) {
      const eventString = `${eventId}-${uuidv4()}`;
      await Participants.updateOne({ uname: data.uname }, { $push: { events: eventString } });
      await Events.updateOne({ _id: eventId }, { $inc: { registeredParticipants: 1 } });
      res.status(200).json({ msg: 'Event Registration Was Successful' });
    } else {
      res.json({ msg: 'The event clashers with already registered event.' });
    }
  } catch (e) {
    res.status(500).json({ msg: `Error: ${e}` });
  }
});

// WIP
router.delete('/delevent', async (req: Request, res: Response): Promise<void> => {
  const eventId = req.body.id;
  const token = req.body.jwt;
  try {
    const tempData = jwt.verify(token, jwtSecret);
    const data = JSON.parse(JSON.stringify(tempData));
    const usr = await Participants.findOne({ uname: data.uname });
    usr?.events.forEach(async (eve) => {
      const arr = eve.split('-');
      if (eventId === arr[0]) {
        await Participants.updateOne({ uname: data.uname }, { $pull: { events: { $in: [eve] } } });
      }
    });
    res.status(200).json({ msg: 'Event successfully deregistered' });
  } catch (e) {
    res.status(500).json({ msg: `Error: ${e}` });
  }
});

export default router;
