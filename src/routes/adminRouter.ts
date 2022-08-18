import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Events from '../models/events';
import verifyToken from '../middlewares/verifyToken';
import { adminPassword, adminUsername, jwtSecret } from '../constants';
import Participants, { IParticipant } from '../models/participants';

const router = express.Router();

// LOGIN
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  let usr = false;
  try {
    if (adminUsername === req.body.uname && adminPassword === req.body.pass) {
      usr = true;
    }
    if (usr) {
      const token = jwt.sign({ uname: req.body.uname }, jwtSecret, { expiresIn: '1d' });
      if (!token) {
        res.json({ code: 0, msg: 'Invalid Token' });
        // console.log('Issue with JWT creation');
        return;
      }
      res.send(token);
    } else {
      res.json({ code: 0, msg: 'Forbidden' });
      // console.log(
      //   `Unauthorized User tried to access /admin,
      // Uname: ${req.body.uname} Pwd: ${req.body.password}`
      // );
      return;
    }
  } catch (e) {
    // console.log(`Error in route (/admin/login): ${e}`);
    res.status(500).json({ msg: `Error: ${e}` });
  }
});

// CREATE
router.post('/add', verifyToken, async (req: Request, res: Response): Promise<void> => {
  const {
    title, desc, start, end, registeredParticipants, maxParticipants,
  } = req.body;
  try {
    await Events.create({
      title,
      desc,
      start,
      end,
      registeredParticipants,
      maxParticipants,
      location: { type: 'Point', coordinates: [req.body.lat, req.body.long] },
    });
    res.status(200).json({ msg: 'Event Added' });
  } catch (e) {
    res.status(500).json({ msg: `Error: ${e}` });
  }
});

// REQUEST - implemented in participantRouter

// UPDATE
router.patch('/update', verifyToken, async (req: Request, res: Response): Promise<void> => {
  const {
    id, title, desc, start, end, registeredParticipants, maxParticipants,
  } = req.body;
  try {
    await Events.updateOne(
      { _id: id },
      {
        $set: {
          title,
          desc,
          start,
          end,
          registeredParticipants,
          maxParticipants,
          location: { type: 'Point', coordinates: [req.body.lat, req.body.long] },
        },
      },
    );
    res.status(200).json({ msg: 'Event Updated' });
  } catch (e) {
    res.status(500).json({ msg: `Error: ${e}` });
  }
});

// DELETE
router.delete('/remove', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    await Events.deleteOne({ _id: req.body.id });
    res.status(200).json({ msg: 'Event removed' });
  } catch (e) {
    res.status(500).json({ msg: `Error: ${e}` });
  }
});

// VERIFY
router.post('/verify', verifyToken, async (req: Request, res: Response): Promise<void> => {
  const eventId = req.body.id;
  const { uname } = req.body;
  try {
    const usr = <IParticipant> await Participants.findOne({ uname });
    usr.events.forEach(async (eve) => {
      const arr = eve.split('-');
      if (eventId === arr[0]) {
        await Participants.updateOne({ uname }, { $pull: { events: { $in: [eve] } } });
      }
    });
    res.status(200).json({ msg: 'Event Attended, pass withdrawn' });
  } catch (e) {
    res.status(500).json({ msg: `Error: ${e}` });
  }
});

export default router;
