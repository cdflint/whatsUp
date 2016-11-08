/*
Event map page
*/
var express = require('express');
var auth = require('authorized');
var router = express.Router();
var domain = require('../appDomain');
var User = domain.dataRepository.User;
var Event = domain.dataRepository.Event;
var geoCoder = require('../appDomain/mdimapgeocoder');
var isLoggedIn = domain.authentication.isLoggedIn;
var http = require('http');
var async = require('async');
var endOfLine = require('os').EOL;
geoCoder.browser = false; //for windows

//middleware makes sure user is logged in before proceeding.
router.use(isLoggedIn);

//set root path
var rootPath = '../'
router.use(function(req, res, next) {
  res.locals.rootPath = rootPath;
  next();
});


/* GET index page. */
router.get('/', function(req, res) {//Lookup users events and load them into panels with edit pencil?
  var done = function( err, user ){
    if( err ){
      return res.render('event/index', { title: "Events",
        message: req.flash('eventsMessage'),
        err: err
      });
    }
    res.render('event/index', { title: "Events", 
      message : req.flash('eventsMessage'),
      user: user,
      rootPath: ''//this is because the path is at whatsup/event no need to go back 1 level
    });
  }
  User.findOne({ email: req.user.email }).populate('events').exec( function( err, user ){
    if( err){
      req.flash('eventsMesssage','Error retrieving events' );
      return done( err );
    }
    if( !user ){
      req.flash('eventsMesssage','Error retrieving events' );
      return done( true ); 
    }
    else
      return done( false, user );
  });
});

//Get add event page
router.get('/add', function( req, res ){
  res.render('event/add', { title:'Add Event'});
}); 


router.get('/edit/:id', function( req, res ){
  var id = req.params.id;
  console.log("Got GET for event update", id);
  Event.findOne({ _id: id}, function( err, event ){
    res.render('event/edit',{
      rootPath:"../../",
      event: event, 
      detail: event.detail,
      title: "Edit Event" } );
  });

});
//
//POST routes.........................................................
//Delete event
router.post('/delete', 
  auth.can('manage event'), function( req, res ){//Authorize as user for event management
    var id = req.body.id;
    var done = function( err, updatedUser ){
      if( err )
        res.render('event/index', { 
          message: req.flash('eventsMessage'), 
          err: err,
          title: 'Events' } );
      else
        res.redirect(rootPath + 'event' );
      //res.render('event/index', { message: req.flash('eventsMessage'), user: updatedUser } );
    }
    Event.remove({ _id: id }, function( err, event ){
      if( err ){
        req.flash('eventsMessage', "Error looking up event" );
        return done( err );
      }
      if( !event ){
        req.flash('eventsMessage', "Could not find event");
        return done( );
      }
      User.findOne({ _id: req.user._id }, function( err, user ){//Find user and delete event id
        if( err ){
          req.flash("eventsMessage", "Error deleting event");
          return done( err );
        }
        if( ! user ){
          req.flash('eventsMessage', "Error deleting event");
          return done( true );
        }
        var index = user.events.indexOf( id );
        if( index > -1 ){
          user.events.splice( index, 1 );
          user.save( function( updatedUser ){
            req.flash('eventsMessage', 'Event deleted successfully');
            return done( false, updatedUser );
          });
        }
        else{
          req.flash('eventMessage', "Error deleting event");
          return done( true );
        }
      });
    });
  });
//
//
router.post('/edit',
  auth.can('manage event'), function( req, res ){
    console.log("Got post for edit")
    var data = req.body;
    console.log("Editing event", data );
    var user = req.user;
    var id = data.id;
    //Done callback
    var done = function( err, event ){
      if( err )
        return res.render('event/edit',{
          message: req.flash('eventsMessage'),
          err: err, 
          event: event, 
          detail: event.detail,
          title: 'Edit Events' } );
      res.redirect( rootPath + 'event' );
    }
    //For update
    //Do not try findOneAndUpdate here, validators cannot access model properly
    //Must first pull model, change attriutes and save
    Event.findOne({ _id: id }, function( err, event ){
      if( err || !event){
        req.flash('eventsMessage','Error updating your profile');
        return done( err, event );
      }
      var detail = {
        address: data.streetAddress,
        description: data.description,
        startDate: data.startDate + " " + data.startTime,
        endDate: data.endDate + " " + data.endTime,
        city: data.city,
        state: data.state,
        ZIP: data.zip
      }

      event.name = data.eventTitle;
      event._creator = user._id;
      event.date = new Date();
      event.detail = detail;

      geoCoder.search({//Use geocoder to lookup
        Street: data.streetAddress,
        City: data.city,
        State: data.state,
        ZIP: data.zip
      }, function( err, res ){
        if( err )
          return done( err, event );
        if( res.candidates.length == 0 ){//If no candidates
          req.flash('eventsMessage', 'Could not find that address, please try agian.');
          return done( true , event );
        }
        var found = false;
        for( i in res.candidates  ){
          var place = res.candidates[i];
          if( place.score > 79 ) {
            found = true;
            event.location = place.location
            event.save( function( err, event ){
              if( err ){
                req.flash('eventsMessage','Error updating your profile');
                return done( err, event );
              }
              req.flash('eventsMessage','Event updated successfully');
              return done( false, event );
            });
            break;
          }
        }
        if( !found ){
          req.flash('eventsMessage', 'Could not find that address, please try agian.');
          done( true, event );
        }
      });
    });
  });
//
//
//Get data from add event page, validate and save
router.post('/add', function( req, res ){
  console.log( req.body )
  var done = function( err, event ){
    console.log("DONE add");
    if( err )
      return res.render('event/add', 
        { message: req.flash('eventsMessage'),
          err: err, 
          event: event, 
          detail: event.detail,
          title: 'Add Event' } );
    res.redirect( rootPath + 'event' );

  }
  var data = req.body;
  var user = req.user;

  User.findOne({ email: req.user.email }, function( err, user ){//Find user
    var location;
    if( err )
      return done( true );
    if( !user )
      return done( true );
    if( data.recurrence == 'Once' )
      return addOneEvent( user, data, req, done );
    addManyEvents( user, data, req, done );

  });
});

function addOneEvent( user, data, req, done ){
  console.log("Adding one event");
  var newEvent = new Event({//Create new event model
    name: data.eventTitle,  
    recurring: false,
    _creator: user._id,
    date: new Date(),
    detail:{
      address: data.streetAddress,
      description: data.description,
      startDate: data.startDate + " " + data.startTime,
      endDate: data.endDate + " " + data.endTime,
      city: data.city,
      state: data.state,
      ZIP: data.zip
    }
  });
  geoCoder.search({//Use geocoder to lookup
    Street: data.streetAddress,
    City: data.city,
    State: data.state,
    ZIP: data.zip
  }, function( err, res ){
    if( err )
      return done( err, newEvent );
    if( res.candidates.length == 0 ){//If no candidates
      req.flash('eventsMessage', 'Could not find that address, please try agian.');
      return done( true, newEvent );
    }
    for( i in res.candidates  ){
      var place = res.candidates[i];
      if( place.score > 79 ) {
        location = place.location;//Else select first candidate
        newEvent.location = location;
        break;
      }
    }
    //Add validation step
    newEvent.save(function( err ){//Save new event
      if( err){
        req.flash('eventsMessage','Error adding event');
        return done( err, newEvent );
      }
      user.pushEvent( newEvent._id );//push event to user
      user.save();//Save user
      done( false );
    });
  });     
}
//Function for adding many events
function addManyEvents( user, data, req, done ){
  var newEvent = new Event({//Create new event model
    name: data.eventTitle,  
    _creator: user._id,
    recurring: true,
    recurrenceId: Math.random().toString(36).substring(7),
    date: new Date(),
    detail:{
      address: data.streetAddress,
      description: data.description,
      startDate: data.startDate + " " + data.startTime,
      endDate: data.endDate + " " + data.endTime,
      city: data.city,
      state: data.state,
      ZIP: data.zip
    }
  });
  if( data.recurrenceNumber < 2 ){
    req.flash('eventsMessage', 'Number of recurrences must be at least 2 if recurring'); 
    return done( true, newEvent );
  }
  geoCoder.search({//Use geocoder to lookup
    Street: data.streetAddress,
    City: data.city,
    State: data.state,
    ZIP: data.zip
  }, function( err, res ){
    if( err )
      return done( err, newEvent );
    if( res.candidates.length == 0 ){//If no candidates
      req.flash('eventsMessage', 'Could not find that address, please try agian.');
      return done( true, newEvent );
    }
    for( i in res.candidates  ){
      var place = res.candidates[i];
      if( place.score > 79 ) {
        location = place.location;// select first candidate with score > 79
        newEvent.location = location;
        break;
      }
    }
    //Create events from generate recurrenct events function
    events = generateRecurrentEvents( newEvent, data.recurrence, ( data.recurrenceNumber - 1 ) );
    async.eachSeries( events, function( event, onErr ){
      event.save(function( err ){//Save new event
        if( err){
          req.flash('eventsMessage','Error adding event');
          return onErr( err );
        }
        user.pushEvent( event._id );//push event to user
        user.save();//Save useri
        return onErr( false );
      })
    },function( err ){
      if( err )
        done( true, newEvent );
      else
        done( false );
    });
  });
}
//Replicate model recurrenceNumber times
function generateRecurrentEvents( eventModel, recurrence, recurrenceNumber ){
  var currEvent = eventModel;
  var events = [];
  var incrementer = null;
  var d = eventModel.detail;
  var newStart = new Date(d.startDate);
  var newEnd = new Date(d.endDate);
  events.push(eventModel);


  switch( recurrence ){
    case 'Monthly': incrementer = monthlyIncrementer;
      break;
    case 'Weekly': incrementer = weeklyIncrementer;
      break;
    case 'Daily': incrementer = dailyIncrementer;
      break;
  }

  for( var i = 0; i< recurrenceNumber; i++ ){
    var currEvent = copyEvent( currEvent, incrementer( newStart, newEnd ) );
    newStart = new Date( currEvent.detail.startDate );
    newEnd =  new Date( currEvent.detail.endDate ); 
    events.push( currEvent );
  }  
  return events;

}

///Funtions to increment
function monthlyIncrementer( newStart, newEnd ){
  newStart.setMonth( newStart.getMonth() + 1 );
  newEnd.setMonth( newEnd.getMonth() + 1 );
  return { newStart: newStart, newEnd: newEnd };
}

function weeklyIncrementer( newStart, newEnd ){
  newStart.setDate( newStart.getDate() + 7 );
  newEnd.setDate( newEnd.getDate() + 7 );
  return { newStart: newStart, newEnd: newEnd };
}

function dailyIncrementer( newStart, newEnd ){
  newStart.setDate( newStart.getDate() + 1 );
  newEnd.setDate( newEnd.getDate() + 1 );
  return { newStart: newStart, newEnd: newEnd };
}

function copyEvent( event, dates ){
  var d = event.detail;
  return new Event({//Create new event model
    name: event.name,
    recurring: event.recurring,
    recurrenceId: event.recurrenceId,
    _creator: event._creator,
    date: new Date(),
    location: event.location,
    detail:{
      address: d.address,
      description: d.description,
      startDate: dates.newStart,
      endDate: dates.newEnd,
      city: d.city,
      state: d.state,
      ZIP: d.ZIP
    }
  });
}

function removeRecurrentEvents( eventModel ){
}

module.exports = router;
