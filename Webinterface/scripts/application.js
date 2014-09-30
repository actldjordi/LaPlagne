var app = {

    // start the application
    start: function (deviceHive, deviceId) {
        this.deviceHive = deviceHive;

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
                    if (equipment.id == "LED") {
                        that.updateLedState(equipment.parameters.state);
                    }
                    else if (equipment.id == "temp") {
                        that.updateTemperature(equipment.parameters.temperature);
                    }
                });
            })
            .fail(that.handleError);
    },

    // subscribes to device notifications
    subscribeNotifications: function (device) {
        var that = this;
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

    // handles incoming notification
    handleNotification: function (deviceId, notification) {
        if (notification.notification == "equipment") {
            if (notification.parameters.equipment == "LED") this.updateLedState(notification.parameters.state); 
            if (notification.parameters.equipment == "temp") this.updateTemperature(notification.parameters.temperature);
            if (notification.parameters.equipment == "MAXTEMP") this.updateTempState(notification.parameters.state); 
            if (notification.parameters.equipment == "MINTEMP") this.updateTempState(notification.parameters.state); 
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
    },

    // updates device information on the page
    updateDeviceInfo: function (device) {
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
    },
     // updates Temperature state on the page
    updateTempState: function (state) {
        alert('Temperature set to: '+state);
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
    }
}