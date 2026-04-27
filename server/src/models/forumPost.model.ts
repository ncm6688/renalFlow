import mongoose, { Schema, Document, Types } from "mongoose";

export interface IForumPost extends Document {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  title: string;
  body: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const forumPostSchema = new Schema<IForumPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: 8000 },
    tags: { type: [String], default: [], index: true },
  },
  { timestamps: true }
);

forumPostSchema.index({ title: "text", body: "text", tags: "text" });

const ForumPost = mongoose.model<IForumPost>("ForumPost", forumPostSchema);
export default ForumPost;

