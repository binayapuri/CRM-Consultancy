import express from 'express';
import Message from '../models/Message.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const getConsultancyId = (user) => user.profile?.consultancyId || user._id;

router.get('/', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const messages = await Message.find({ consultancyId: cid })
      .populate('senderId', 'profile email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const cid = getConsultancyId(req.user);
    const msg = await Message.create({
      consultancyId: cid,
      senderId: req.user._id,
      text: req.body.text,
    });
    const populated = await Message.findById(msg._id).populate('senderId', 'profile email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
