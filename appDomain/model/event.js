/*
This defines schema for model Event
*/
// var connectionStr = require('../../config').database.mongodb;

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// mongoose.connect(connectionStr);
// Validators ============================================

var nameValidator = function(name) {
  //Capitalize
  console.log("Validate", name);
  return true;
}


var endDateAfterToday = function(endDate) {
  var now = new Date();
  if (endDate < now)
    return false
  return true;
}

var endDateAfterStartDate = function(endDate) {
  console.log("Start date end date .............");
  if (this.detail.startDate > endDate)
    return false
  return true
}

var endDateValidators = [
  { validator: endDateAfterToday, message: 'End date cannot be before today' },
  { validator: endDateAfterStartDate, message: 'End date cannot be before start date' }
];
var EventSchema = new Schema({

  groupId : Schema.Types.ObjectId,
  // id: String,
  _creator: { 
      type: Schema.Types.ObjectId,
       ref: 'User'
  }, //populated field
  recurring:{ 
    type: Boolean,
  },
  recurrenceId: {
    type: String,
  },
  name: {
    type: String,
    required: [true, "Event name is required"],
    validate: {
      validator: nameValidator,
      message: "Name entered is invalid"
    }
  },
  date: Date,
  location: Object,
  detail: {
    description: {
      type: String,
      required: [true, 'Description required']
    },
    startDate: {
      type: Date,
      required: [true, 'Description required']
    },
    endDate: {
      type: Date,
      validate: endDateValidators
    },
    address: {
      type: String,
      required: [true, 'Street Address required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    ZIP: {
      type: Number,
      required: [true, 'ZIP is required']
    }

    //other details can be added here
  }
});

module.exports = mongoose.model('Event', EventSchema);
