var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

// now creating the Fact schema..
var factSchema = new Schema({
  _livesIn: { type: Schema.Types.ObjectId, ref: 'Palace', required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  created: { type: Date, default: Date.now }
});
var Fact = mongoose.model('Fact', factSchema);

module.exports = Fact;
