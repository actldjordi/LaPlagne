// Arrows

$(function() {
	$(".down").click(function() {
	var s = $("#slider-range-min"), val = s.slider("value"), step = s.slider("option", "step");
	s.slider("value", val - step);
	$( "#amount" ).val($ ( "#slider-range-min" ).slider( "value" ) );
	})
		
	$(".up").click(function() {
	var s = $("#slider-range-min"), val = s.slider("value"), step = s.slider("option", "step");
	s.slider("value", val + step);
	$( "#amount" ).val($ ( "#slider-range-min" ).slider( "value" ) );
	
	})
	
		});