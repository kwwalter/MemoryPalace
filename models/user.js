var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

// creating the User schema..
var userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  palaces: [{ type: Schema.Types.ObjectId, ref: 'Palace' }],
  created: { type: Date, default: Date.now }
});
var User = mongoose.model('User', userSchema);

module.exports = User;
