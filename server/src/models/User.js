import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'STUDENT'], required: true },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String,
    marnNumber: String,
    consultancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy' },
    preferredEmailProfileId: String, // _id of consultancy emailProfiles item - employee's choice
    passportNumber: String,
    passportExpiry: Date,
    passportCountry: String,
    address: {
      street: String,
      city: String,
      state: String,
      postcode: String,
      country: String,
    },
  },
  invitationToken: String,
  mustChangePassword: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isTestAccount: { type: Boolean, default: false }, // Super Admin test accounts
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
