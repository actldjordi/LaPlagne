
var app = {
    // start the application
    start: function (deviceHive, deviceId) {
        this.deviceHive = deviceHive;
        //this.tab_devicelist = $('#Devicelist').DataTable();

        // get device information
        var that = this;
        this.deviceHive.getDevice(deviceId)
            .done(function (device) {
                that.device = device;
                that.updateDeviceInfo(device);
                that.getLedState(device);
                that.subscribeNotifications(device);
                that.bindLedControl();
            })
            .fail(that.handleError);
    },

    // gets current led state
    getLedState: function (device) {
        var that = this;
        this.deviceHive.getEquipmentState(device.id)
            .done(function (data) {
                jQuery.each(data, function (index, equipment) {
                    if (equipment.id == "LED") {//TODO change LED name on device and web_app sides
                        that.updateLedState(equipment.parameters.state);
                    }
                    else if (equipment.id == "temp") {
                        that.updateTemperature(equipment.parameters.temperature);
                    }
                    else if (equipment.id == "MAXTEMP") {
                        that.updatemaxTempState(equipment.parameters.state);
                    }
                    else if (equipment.id == "MINTEMP") {
                        that.updateminTempState(equipment.parameters.state);
                    }
                });
            })
            .fail(that.handleError);
    },

    // subscribes to device notifications
    subscribeNotifications: function (device) {
        var that = this;
         if  (that.deviceHive.channelState == 2){/*open just one device for notifications at a time*/that.deviceHive.unsubscribe();that.deviceHive.closeChannel();}
        this.deviceHive.channelStateChanged(function (data) {
            that.updateChannelState(data.newState);
        });
        this.deviceHive.notification(function () {
            that.handleNotification.apply(that, arguments);
        });
        this.deviceHive.openChannel()
            .done(function() { that.deviceHive.subscribe(device.id); })
            .fail(that.handleError);
    },
        // subscribes to device notifications
    unsubscribeNotifications: function (device) {
        var that = this;
        that.deviceHive.unsubscribe(null);
            
    },

    // handles incoming notification
    handleNotification: function (deviceId, notification) {
        if (notification.notification == "equipment") {
            if (notification.parameters.equipment == "LED") this.updateLedState(notification.parameters.state); 
            if (notification.parameters.equipment == "temp") this.updateTemperature(notification.parameters.temperature);
            if (notification.parameters.equipment == "MAXTEMP") this.updatemaxTempState(notification.parameters.state); 
            if (notification.parameters.equipment == "MINTEMP") this.updateminTempState(notification.parameters.state); 
        }
        else if (notification.notification == "$device-update") {
            if (notification.parameters.status) this.device.status = notification.parameters.status;
            if (notification.parameters.name) this.device.name = notification.parameters.name;
            this.updateDeviceInfo(this.device);
        }
    },

    // bind LED On/Off button click handler
    bindLedControl: function () {
        var that = this;
        $(".send").click(function() {
            var state = $(this).is(".on") ? "1" : "0";
            that.deviceHive.sendCommand(that.device.id, "UpdateDevice", { equipment: "LED", state: state })
                .fail(that.handleError);
                
                var person = new Object();
                person.start = "2014-09-26T14:27:06.143000";
                person.end = "2014-10-01T14:27:06.143000";
                person.notification = 'equipment';
                person.take = 10;
                //alert(person.notification);
        });
       
		$(".maxtemp").click(function() {
            var state = $(".maxv").val();//alert('maxtemp');
            that.deviceHive.sendCommand(that.device.id, "UpdateDevice", { equipment: "MAXTEMP", state: state })
                .fail(that.handleError);
        });
		$(".mintemp").click(function() {
            var state = $(".minv").val();//alert('mintemp');
            that.deviceHive.sendCommand(that.device.id, "UpdateDevice", { equipment: "MINTEMP", state: state })
                .fail(that.handleError);
        });
        $('div.pwr-btn').click(function(){
            if($(this).hasClass('off')) {
                $(this).removeClass('off').addClass('on');
                //do staff
                var state = "1";
                that.deviceHive.sendCommand(that.device.id, "UpdateDevice", { equipment: "LED", state: state })
                .fail(that.handleError);
          
            }
            else {
                $(this).removeClass('on').addClass('off');
                //do staff
                var state = "0";
                that.deviceHive.sendCommand(that.device.id, "UpdateDevice", { equipment: "LED", state: state })
                .fail(that.handleError);

            }
});
    },

    // updates device information on the page
    updateDeviceInfo: function (device) {//alert(device.name);
        $(".device-name").text(device.name);
        $(".device-status").text(device.status);
    },

    // updates channel state
    updateChannelState: function (state) {
        if (state === DeviceHive.channelState.connected)
            $(".channel-state").text("Connected");
        if (state === DeviceHive.channelState.connecting)
            $(".channel-state").text("Connecting");
        if (state === DeviceHive.channelState.disconnected)
            $(".channel-state").text("Disconnected");
    },

    // updates LED state on the page
    updateLedState: function (state) {
        var on = state == 1 || state == "1";
        $(".device-FAN-state").removeClass("on off").addClass(on ? "on" : "off");
        //$('div.toggler').removeClass('hrs min').addClass(on ? "hrs" : "min");
        $('div.pwr-btn').removeClass('on off').addClass(on ? "on" : "off");
    },
     // updates Temperature state on the page
    updatemaxTempState: function (state) {
    $(".maxv").val(state);
       //alert('max Temperature set to: '+state);
    },
         // updates Temperature state on the page
    updateminTempState: function (state) {
    $(".minv").val(state);
        //alert('min Temperature set to: '+state);
    },

    // updates temperature on the page
    updateTemperature: function (temperature) {
        $(".device-temperature").text(temperature);
        $(".device-temperature").toggleClass("big", temperature >= 30);
    },

    formatDate: function(date) {
        var pad = function(d) { return d < 10 ? "0" + d : d; };
        return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear() + " " + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
    },

    handleError: function (e, xhr) {
        alert(e);
    },

	updateGraph: function (deviceId) {
    var temperatureData = { values:[]};

    var graph;
    var xPadding = 50;
    var yPadding = 50;

		var filter = new Object();
		var currentDate = new Date();
		var days = 1; 										// Amount of days to display on the temperature graph

		var endTime = currentDate.toISOString();			// Current date and time
		var startTime = new Date();
		
		startTime.setDate(startTime.getDate() - days);		// the start time is a few days ago	
		
		var timeAxis = currentDate - startTime;
		
		filter.start = startTime.toISOString();
		filter.end = endTime;
		//filter.take = 10;
		
		this.deviceHive.getNotifications(deviceId, filter)
			.done(function (data) {
                jQuery.each(data, function (index, equipment) {
					if (equipment.parameters.equipment == "temp") {
						var element = { X: equipment.timestamp, Y: equipment.parameters.temperature };
						temperatureData.values.push(element);
                    }
                });
				
				// Returns the max Y value in our data list
				function getMaxY() {
					var max = 0;
					
					for(var i = 0; i < temperatureData.values.length; i ++) {
						if(temperatureData.values[i].Y > max) {
							max = temperatureData.values[i].Y;
						}
					}
					
					max += 5 - max % 5;
					return max;
				}
				
				// Return the x pixel for a graph point
				function getXPixel(val) {
					return ((graph.width() - xPadding) / temperatureData.values.length) * val + (xPadding * 1);
				}
				
				// Return the y pixel for a graph point
				function getYPixel(val) {
					return graph.height() - (((graph.height() - yPadding) / getMaxY()) * val) - yPadding;
				}
				
				// Return the x pixel by timestamp
				function getXPixelByTimestamp(timestamp) {
					var relativeTimeAxis = new Date(timestamp) - startTime;
					return ((graph.width() - xPadding) / timeAxis) * relativeTimeAxis + (xPadding * 1);
				}
				
				graph = $('#graph');
				
				var c = graph[0].getContext('2d');            
				
                
				c.lineWidth = 1;
				c.strokeStyle = '#333';
				c.font = 'italic 8pt sans-serif';
				c.textAlign = "center";
				
				// Draw the axis
				c.beginPath();
				c.moveTo(xPadding, 0);
				c.lineTo(xPadding, graph.height() - yPadding);
				c.lineTo(graph.width(), graph.height() - yPadding);
				c.stroke();
				
				// Draw the X value texts
				c.fillText("time", graph.width() - 10, graph.height() - yPadding + 40);
				
				for(var i = 0; i <= timeAxis; i += (timeAxis / 10)) {
					var XTimeAxis = new Date(startTime);
					XTimeAxis.setTime(XTimeAxis.getTime() + i);
					XTimeAxis = XTimeAxis.toISOString();
					var time = XTimeAxis.substring(XTimeAxis.lastIndexOf("T") + 1, XTimeAxis.lastIndexOf(":"));
					c.fillText(time, getXPixelByTimestamp(XTimeAxis), graph.height() - yPadding + 20);
				}
				
				// Draw the Y value texts
				c.textAlign = "right"
				c.textBaseline = "middle";
				c.fillText("T(°C)", xPadding - 10, 10);
				
				for(var i = 0; i < getMaxY(); i += 5) {
					c.fillText(i, xPadding - 10, getYPixel(i));
				}
				
				c.strokeStyle = '#f00';

				// Draw the line graph
				c.beginPath();
				c.moveTo(getXPixel(0), getYPixel(temperatureData.values[0].Y));
				for(var i = 1; i < temperatureData.values.length; i ++) {
					c.lineTo(getXPixelByTimestamp(temperatureData.values[i].X), getYPixel(temperatureData.values[i].Y));
				}
				c.stroke();
				
				// Draw the dots
				/*c.fillStyle = '#333';
				
				for(var i = 0; i < temperatureData.values.length; i ++) {  
					c.beginPath();
					c.arc(getXPixelByTimestamp(temperatureData.values[i].X), getYPixel(temperatureData.values[i].Y), 2, 0, Math.PI * 2, true);
					c.fill();
				}*/
		
			})
		.fail(this.handleError);
	}
}