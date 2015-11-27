var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

// creating the Palace schema..
var palaceSchema = new Schema({
  name: { type: String, required: true },
  // facts: [ { type: Schema.Types.ObjectId, ref: 'Fact' } ],
  facts: [ { question: String, answer: String } ],
  _owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  created: { type: Date, default: Date.now }
});
var Palace = mongoose.model('Palace', palaceSchema);

module.exports = Palace;
