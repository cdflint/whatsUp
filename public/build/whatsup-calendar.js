var startUp = function(){
    console.log( "Starting calendar " );
    function populateChart( events ){
      for( var i in events ){
          events[i].start =  events[i].detail.startDate;
          events[i].end = events[i].detail.endDate;
          events[i].title = events[i].name;
      }
      
      $('#calendar').fullCalendar({
        events,
        eventRender: function( event, element ){
          console.log( event, element );
          element.qtip({
            content: "Hello WOrld"
          }); 
        }
      }); 
    }
  
    $.ajax({
      url: 'events',
      dataType: 'json',
      success: populateChart,
      error: function(){ console.log("Error getting events") }
    });
}
