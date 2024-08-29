import mongoose,{Schema} from "mongoose";


// subscribers are users who follows you, also your channel (like in YT, FB) is also like a user
const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one to whom "subscribers" are subscribing
        ref: "User"
    }
},{timestamps: true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)