import mongoose, { Schema } from 'mongoose';

const FreeKeyEntitlementSchema = new Schema({
  scope: { type: String, required: true, unique: true },
  claimId: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true, collection: 'free_key_entitlements' });

// Cleanup is best-effort; claim logic can replace an expired record before TTL runs.
FreeKeyEntitlementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.FreeKeyEntitlement
  || mongoose.model('FreeKeyEntitlement', FreeKeyEntitlementSchema);
