import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: [String, "Video Not available"],
            required: true
        },
        thumbnail: {
            type: [String, "thumbnail Not available"],
            required: true
        },
        description: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        duration: {
            type: Number,
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }
    ,{
        timestamps: true
    })
//mongoose-aggregate-paginate-v2 came late in monogDB so we have to use it as a plugin, and plugin is a hook
videoSchema.plugin(mongooseAggregatePaginate) 

export const Video = mongoose.model("Video", videoSchema)