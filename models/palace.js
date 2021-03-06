var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

// creating the Palace schema..
var palaceSchema = new Schema({
  name: { type: String, required: true },
  imageNumber: { type: Number, required: true },
  facts: [ { type: Schema.Types.ObjectId, ref: 'Fact' } ],
  // facts: [ { question: String, answer: String } ],
  _owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  created: { type: Date, default: Date.now },
  public: { type: Boolean, default: false }
});
var Palace = mongoose.model('Palace', palaceSchema);

module.exports = Palace;
