/* *********************************************************************************************

Login form 

********************************************************************************************* */

$(document).ready(function() {

	// Check if JavaScript is enabled
	$('body').addClass('js');

	// Make the checkbox checked on load
	$('.login-form span').addClass('checked').children('input').attr('checked', true);

	// Click function
	$('.login-form span').on('click', function() {

		if ($(this).children('input').attr('checked')) {
			$(this).children('input').attr('checked', false);
			$(this).removeClass('checked');
           
		}

		else {
			$(this).children('input').attr('checked', true);
			$(this).addClass('checked');
             
		}
	
	});
    	// Click functionlogin-submit
	$('.login-form .login-submit').on('click', function() {
            //alert($('#usern').val()+':'+$('#passw').val());           
            sessionStorage.setItem("usId",$('#usern').val());
            sessionStorage.setItem("cred",$('#passw').val());
            window.location.reload();
	
	});
    
    $('.relogin-form .login-submit').on('click', function() {
            //alert($('#usern').val()+':'+$('#passw').val());           
            sessionStorage.setItem("usId","0");
            sessionStorage.setItem("cred","0");
            window.location.reload();
	
	});
    
    $('#passw').bind("enterKey",function(e){
            sessionStorage.setItem("usId",$('#usern').val());
            sessionStorage.setItem("cred",$('#passw').val());
            window.location.reload();
   
});
$('#passw').keyup(function(e){
    if(e.keyCode == 13)
    {
        $(this).trigger("enterKey");
    }
});

});