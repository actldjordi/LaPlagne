// Slider

		$(function() {
		$( "#slider-range-min" ).slider({
			range: "min",
			value: 10,
			min: 0,
			max: 110,
			disabled:false,
			slide: function( event, ui ) {
				$( "#amount" ).val( "" + ui.value );
			}
		});
		
		$( "#amount" ).val($( "#slider-range-min" ).slider( "value" ) );
		})