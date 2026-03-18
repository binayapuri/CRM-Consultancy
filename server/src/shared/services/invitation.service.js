import Client from '../../shared/models/Client.js';
import User from '../../shared/models/User.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'orivisa-secret-key-change-in-production';

export class InvitationService {
  static async validate(token, email) {
    const client = await Client.findOne({ invitationToken: token, 'profile.email': email });
    if (!client) throw Object.assign(new Error('Invalid or expired invitation'), { status: 400 });
    return { valid: true, clientId: client._id, name: `${client.profile?.firstName} ${client.profile?.lastName}` };
  }

  static async activate(data) {
    const { token, email, password } = data;
    const client = await Client.findOne({ invitationToken: token, 'profile.email': email });
    if (!client) throw Object.assign(new Error('Invalid or expired invitation'), { status: 400 });

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
    return {
      user: { id: user._id, email: user.email, role: user.role, profile: user.profile },
      token: jwtToken,
    };
  }
}
