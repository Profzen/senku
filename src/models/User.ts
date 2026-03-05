import mongoose, { Schema, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    resetPasswordTokenHash: { type: String },
    resetPasswordExpiresAt: { type: Date },
    avatar: { type: String },
    timezone: { type: String, default: "UTC" },
    currency: { type: String, default: "USD" },
    preferences: {
      theme: { type: String, enum: ["dark", "light"], default: "dark" },
      dateFormat: { type: String, enum: ["dd/MM/yyyy", "MM/dd/yyyy"], default: "dd/MM/yyyy" },
      notifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof UserSchema>;

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
