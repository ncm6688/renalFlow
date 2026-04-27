import mongoose, { Schema, Document, Types } from "mongoose";

export interface IForumComment extends Document {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const forumCommentSchema = new Schema<IForumComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: "ForumPost", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { timestamps: true }
);

const ForumComment = mongoose.model<IForumComment>("ForumComment", forumCommentSchema);
export default ForumComment;

