import mongoose, { models, Schema } from "mongoose";
import { UserType } from "../types/common";
import { validateEmail } from "../utils/validators";


const UserSchema = new Schema<UserType>(
  {
    name: { type: String, required: false },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: (value: string) => validateEmail(value),
        message: (props: { value: string }) =>
          `${props.value} is not a valid email`,
      },
    },
    password: { type: String, required: true, minlength: 8 },
  },
  { timestamps: true },
);

export const User = models.User || mongoose.model<UserType>("User", UserSchema);
