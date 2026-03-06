import express from 'express';
import Client from '../models/Client.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'orivisa-secret-key-change-in-production';

router.get('/validate', async (req, res) => {
  try {
    const { token, email } = req.query;
    const client = await Client.findOne({ invitationToken: token, 'profile.email': email });
    if (!client) return res.status(400).json({ error: 'Invalid or expired invitation' });
    res.json({ valid: true, clientId: client._id, name: `${client.profile?.firstName} ${client.profile?.lastName}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/activate', async (req, res) => {
  try {
    const { token, email, password } = req.body;
    const client = await Client.findOne({ invitationToken: token, 'profile.email': email });
    if (!client) return res.status(400).json({ error: 'Invalid or expired invitation' });
    let user = await User.findOne({ email });
    if (user) {
      user.password = password;
      user.mustChangePassword = false;
      user.invitationToken = null;
      await user.save();
    } else {
      user = await User.create({
        email,
        password,
        role: 'STUDENT',
        profile: { firstName: client.profile?.firstName, lastName: client.profile?.lastName },
      });
    }
    await Client.findByIdAndUpdate(client._id, {
      userId: user._id,
      invitationToken: null,
      invitationAcceptedAt: new Date(),
    });
    const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      user: { id: user._id, email: user.email, role: user.role, profile: user.profile },
      token: jwtToken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
