// Min/Hrs Toggle

$(function() {
$('div.toggler').click(function(){
  if($(this).hasClass('min')) {
      $(this).removeClass('min').addClass('hrs');
      //do staff
	  $('div.screen-bg').removeClass('min');
      $('div.screen-bg').addClass('hrs');
	  
  }
  else {
      $(this).removeClass('hrs').addClass('min');
      //do staff
	  $('div.screen-bg').removeClass('hrs');
      $('div.screen-bg').addClass('min');

  }
});

})