// Power Button

$(function() {
$('div.pwr-btn').click(function(){
  if($(this).hasClass('on')) {
      $(this).removeClass('on').addClass('off');
	  $('div.screen-bg.min').addClass('dim');
	  $('div.screen-bg.hrs').addClass('dim');
	  $('div.screen-bg.min').removeClass('bright');
	  $('div.screen-bg.hrs').removeClass('bright');
	  $('.down').addClass('off');
	  $('.down').removeClass('on');	
	  $('.up').removeClass('on');	  
      $('.up').addClass('off');
	  
	//getter
	var disabled = $( "#slider-range-min" ).slider( "option", "disabled" );
	//setter
	$( "#slider-range-min" ).slider( "option", "disabled", true );
		  
  }
  else {
      $(this).removeClass('off').addClass('on');
      //getter
	var disabled = $( "#slider-range-min" ).slider( "option", "disabled" );
	//setter
	$( "#slider-range-min" ).slider( "option", "disabled", false );
	$('div.screen-bg.min').removeClass('dim');
	$('div.screen-bg.hrs').removeClass('dim');
	$('div.screen-bg.min').addClass('bright');
	$('div.screen-bg.hrs').addClass('bright');
	$('.down').removeClass('off');	
	$('.down').addClass('on');	
	$('.up').removeClass('off');	
	$('.up').addClass('on');	 
  }
});

})