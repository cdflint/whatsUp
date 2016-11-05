(function(){
  $('#startDate').datepicker();
  $('#endDate').datepicker();
  $('#startTime').timepicker();
  $('#endTime').timepicker();
  var numberRecurrenceFeild = $('#recurrenceNumber');
  console.log( numberRecurrenceFeild );
  $('#recurrenceSelect').on('change', function(e){
        
          if( e.target.value != 'Once' )
            numberRecurrenceFeild.prop('disabled',false);     
          else
            numberRecurrenceFeild.prop('disabled',true);     
         
    });

})();
