import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, sparse: true }, // sparse: allow null for phone-only users
  password: { type: String }, // null for OAuth/phone-only until they set one
  phone: { type: String, sparse: true }, // for phone login
  phoneVerified: { type: Boolean, default: false },
  googleId: { type: String, sparse: true },
  role: { type: String, enum: ['SUPER_ADMIN', 'CONSULTANCY_ADMIN', 'MANAGER', 'AGENT', 'STUDENT', 'SPONSOR'], required: true },
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sponsor' }, // when role=SPONSOR
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
  isTestAccount: { type: Boolean, default: false },
  passwordResetToken: String,
  passwordResetExpires: Date,
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.phone && !this.email) this.email = `${this.phone.replace(/\D/g, '')}@orivisa.phone`;
  if (!this.isModified('password')) return next();
  if (this.password) this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
