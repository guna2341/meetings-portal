"use server"

import mongoose, { Mongoose } from "mongoose";

const MONGOOSE_URI: string | undefined = process.env.MONGOOSE_URI;

declare global {
    var mongoose: Mongoose | undefined;
  }
  
(globalThis.mongoose as Mongoose | null) = null;

async function connectDB() {
    try {
        if (!MONGOOSE_URI) {
            throw new Error("Mongoose URI is not defined");
        }
        if (globalThis.mongoose) return globalThis.mongoose;

        globalThis.mongoose = await mongoose.connect(MONGOOSE_URI);

        return globalThis.mongoose;
    }
    catch (err: unknown) {
        console.log(err);
    }
}

export const db = await connectDB();