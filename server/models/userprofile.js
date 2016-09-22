var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var accessSchema = new Schema({
  branch: {
    type: Boolean,
    default: false
  },
  playground: {
    type: Boolean,
    default: false
  }
})

var userProfileSchema = new Schema({
  userId: Schema.ObjectId,
  email: {
    type: String,
    required: true,
    unique: true
  },
  fullname: String,
  username: {
    type: String,
    required: true,
    unique: true
  },
  approved: {
    type: Boolean,
    default: true
  },
  role: {
    type: Schema.ObjectId,
    ref: 'userrole',
    default: "558c1e12f947a1a8d63b1396"
  },
  image: String,
  thumbnail: String,
  company: String, //Company name
  bio: String,
  title: String,
  city: String,
  state: String,
  country: String,
  avatar: Buffer,
  profilepicture: Buffer,
  github_user: String,
  unsubscribed: Boolean,
  linked_to_github: {
    type: Boolean,
    default: false
  },
  facebook: String,
  twitter: String,
  website: String,
  createdate: {
    type: Date,
    default: Date.now
  },
  createdate_num: Number,
  lastvisit: Date,
  lastvisit_num: Number,
  access: accessSchema
});

module.exports = mongoose.model('userprofiles', userProfileSchema);
