#/usr/bin/env python

# @author KEFI Bilel
# Use RASPI thermosensor sample from devicehive as template
# 
#

import glob
import sys
import os
import time
from time import sleep


try:
    import RPi.GPIO as GPIO

    def get_i2c_file():
        base_dir = '/sys/bus/w1/devices/'
        device_folder = glob.glob(base_dir + '28*')
        if not device_folder:
            print 'Make sure that DS18B20 sensor is connected'
            exit()
        return device_folder[0] + '/w1_slave'
except ImportError:
    class FakeGPIO(object):
        OUT = 'OUTPUT BCM.GPIO17'
        BOARD = 'BOARD'
        BCM = 'BCM'
        def __init__(self):
            print 'Fake gpio initialized'
        def setmode(self, value):
            print 'Set mode {0}.'.format(value)
        def setup(self, io, mode):
            print 'Set gpio {0}; Mode: {1};'.format(io, mode)
        def output(self, io, vlaue):
            print 'Set gpio {0}; Value: {1};'.format(io, vlaue)
    GPIO = FakeGPIO()

    def get_i2c_file():
        return '/dev/null'

from zope.interface import implements
from twisted.python import log
from twisted.internet import reactor, task

import devicehive
import devicehive.auto

import shelve


# change it to match your address for 1-wire sensor
_W1_FILENAME=get_i2c_file()
if not os.path.exists(_W1_FILENAME) :
    _W1_FILENAME = '/dev/null'

# Board's pin #11 (GPIO18)
_LED_PIN = 12
_FAN_PIN = 12
_HEAT_PIN = 11
_DeviceID='9f33566e-1f8f-11e2-8979-c42c030dd6b3'
_DeviceNAME='device3'

# API URL (register for free playground at http://beta2.devicehive.com/playground
_API_URL = 'http://nn6156.pg.devicehive.com/api'

gsettings = shelve.open('tempsettings')
if not gsettings.has_key('maxtemp') :
   gsettings['maxtemp'] = 29
if not gsettings.has_key('mintemp') :
   gsettings['mintemp'] = 9


class RasPiConfig(object):
    """
    for easier reading, this class holds all registration information for DeviceHive
    """

    implements(devicehive.interfaces.IDeviceInfo)

    @property
    def id(self):
        return _DeviceID
    
    @property
    def key(self):
        return 'device-key'
    
    @property
    def name(self):
        return _DeviceNAME
    
    @property
    def status(self):
        return 'Online'
    
    @property
    def network(self):
        return devicehive.Network(key = 'Temperaturecontrol', name = 'Temperaturecontrol', descr = 'RasPi/Py LED/w1 tempsens')
    
    @property
    def device_class(self):
        return devicehive.DeviceClass(name='Class1', version='1.0', is_permanent=False)
    
    @property
    def equipment(self):
        return [devicehive.Equipment(name = 'LED', code = 'LED', type = 'Controllable LED'), devicehive.Equipment(name = 'THERMO', code = 'temp', type = 'TempSensor'), devicehive.Equipment(name = 'MINTEMP', code = 'MINTEMP', type = 'TempSensor'), devicehive.Equipment(name = 'MAXTEMP', code = 'MAXTEMP', type = 'TempSensor')]

    @property
    def data(self):
        return None

    def to_dict(self):
        res = {
            'key': self.key,
            'name': self.name
        }

        if self.status is not None:
            res['status'] = self.status
   
        if self.network is not None:
            res['network'] = self.network.to_dict() if devicehive.interfaces.INetwork.implementedBy(self.network.__class__) else self.network
            res['deviceClass'] = self.device_class.to_dict() if devicehive.interfaces.IDeviceClass.implementedBy(self.device_class.__class__) else self.device_class

        if self.equipment is not None:
            res['equipment'] = [x.to_dict() for x in self.equipment]

        return res


class RasPiApp(object):
    """
    This class handles DeviceHive API calls for our device
    """
    
    implements(devicehive.interfaces.IProtoHandler)
    
    def __init__(self, led, sensor, lcd):
        super(RasPiApp, self).__init__()
        self.connected = False
        self.notifs = []
        self.info = RasPiConfig()
        self.led = led
        self.sensor = sensor
        self.relays = relays
    
    def on_apimeta(self, websocket_server, server_time):
        log.msg('on_apimeta')
    
    def on_connected(self):
        log.msg('Connected to devicehive server.')
        self.connected = True
        
        lc = task.LoopingCall(self.sensor.get_temp, self)
        lc.start(1)
        
        for onotif in self.notifs :
            self.factory.notify(onotif['notification'], onotif['parameters'],device_id=self.info.id, device_key = self.info.key)
        self.notifs = []
        def on_subscribe(result) :
            self.factory.subscribe(self.info.id, self.info.key)
        def on_failed(reason) :
            log.err('Failed to save device {0}. Reason: {1}.'.format(self.info, reason))
        self.factory.device_save(self.info).addCallbacks(on_subscribe, on_failed)
    
    def on_connection_failed(self, reason) :
        print('# BILL on_connection_failed')
        pass
        
    
    def on_closing_connection(self):
        print('# BILL on_closing_connection(')
        pass
    
    def on_failure(self, device_id, reason):
        print('# BILL on_failure')
        pass
    
    def do_short_command(self, finished, equipment = None, state = 0):
        log.msg('Setting {0} equipment to {1}'.format(equipment, state))
        if equipment == 'LED' :
            if int(state) == 0 :
                self.led.set_off()
                print('BILL LED OFF')
                
            else:
                self.led.set_on()
                print('BILL LED ON')
				
        if equipment == 'MINTEMP' :
                self.sensor.set_min_temp(state)
                print('- - - BILL MINTEMP')
                
				
        if equipment == 'MAXTEMP' :
                self.sensor.set_max_temp(state)
                print('- - - BILL MAXTEMP')

        gsettings.sync()        
        # upon completion post the result back
        self.factory.notify('equipment', {'state': state, 'equipment': equipment }, device_id = self.info.id, device_key = self.info.key)
        finished.callback(devicehive.CommandResult('Completed'))

    def do_set_command(self, finished, text=None):
        #self.lcd.write_string(text or '') Bill desactivate lcd
        finished.callback(devicehive.CommandResult('Completed'))
    
    def on_command(self, device_id, command, finished):
        # Expecting command as 'UpdateState' and parameters as {"equipment" : "LED", "state" : "0"}
        if command.command == 'UpdateDevice' :
            self.do_short_command(finished,  **command.parameters)
        elif command.command == 'set':
            self.do_set_command(finished, **command.parameters)
        else :
            finished.errback()
        # end do_command
    
    def notify(self, notif, **params):
        if self.connected :
            self.factory.notify(notif, params, device_id = self.info.id, device_key = self.info.key)
        else :
            self.notifs.append({'notification': notif, 'parameters': params})



class TempSensor(object):
    """
    Temperature sensor wrapper. Gets temperature readings form file, parses them
    and notifies the services is the difference is greater than a certain threshold.
    """

    def __init__(self, file_name,relays):
        self.file_name = file_name
        self.relays = relays
        self.last_temp = self._get_temp()
        self.last_good_temp = self.last_temp
        #gsettings = shelve.open('tempsettings')
    
    # internal, get temperature readings from device and check CRC
    def _get_temp9(self):
        self.last_good_temp = self.last_good_temp + 0.2;
        print(str(gsettings['mintemp'])+'-'+str(gsettings['maxtemp']))
        return self.last_good_temp

    def _get_temp(self):
        """
        internal, get temperature readings from device and check CRC
        """
        with open(self.file_name) as f:
            content = f.readlines()
            for line in content:
                # sometimes CRC is bad, so we will return last known good temp
                if line.find('crc=')>=0 and line.find('NO')>=0:
                    return self.last_good_temp
                p = line.find('t=')
                if p >= 0:
                    self.last_good_temp = float(line[p+2:])/1000.0
                    return self.last_good_temp
        return 0.0

    def get_temp(self, dev):
        """
        check temperature, if greater than threshold, notify
        """
        temp = self._get_temp()
        if abs(temp - self.last_temp) > 1.0:
            log.msg('Temperature {0} -> {1}'.format(self.last_temp, temp))
            dev.notify('equipment', temperature = temp, equipment = "temp")
            self.last_temp = temp
            
        if (temp > int(gsettings['maxtemp'])):
            #do the above maxtempthing	
            print('Maximum temperature reached temp = '+str(temp)+'>'+str(gsettings['maxtemp']))
            self.relays.HighTemp_mode()
        else:
            if (temp < int(gsettings['mintemp'])):
                #do the under mintempthing	
                print('Minimum temperature reached temp = '+str(temp)+'<'+str(gsettings['mintemp']))
                self.relays.LowTemp_mode()
            else:
                if abs(temp - ((int(gsettings['maxtemp'])+int(gsettings['mintemp']))/2)) < 3:
                    #do the under mintempthing	
                    print('Normal temperature : '+str(gsettings['mintemp'])+'<'+str(temp)+'<'+str(gsettings['maxtemp']))
                    self.relays.NormalTemp_mode()					

    # set minimum temperature
    def set_min_temp(self, s_mintemp):
        gsettings['mintemp'] = s_mintemp
        print(gsettings['mintemp'])
		
    # set maximum temperature
    def set_max_temp(self, s_maxtemp):
        gsettings['maxtemp'] = s_maxtemp
        print(gsettings['maxtemp'])


class LedDevice(object):
    """
    Wrapper from LED connected to RasPi
    """

    def __init__(self, pin):
        """
        We are using board PIN numbering (as opposed to chip's numbers)
        """
        GPIO.setmode(GPIO.BOARD)
        GPIO.setup(pin, GPIO.OUT)

    def blink(self, count):
        GPIO.setmode(GPIO.BOARD)
        for i in range(count):
            GPIO.output(_LED_PIN, True)
            sleep(0.5)
            GPIO.output(_LED_PIN, False)
            sleep(0.5)

    def set_on(self):
        GPIO.setmode(GPIO.BOARD)
        GPIO.output(_LED_PIN, True)

    def set_off(self):
        GPIO.setmode(GPIO.BOARD)
        GPIO.output(_LED_PIN, False)

class RelayDevice(object):
    """
    Wrapper from RELAYs connected to RasPi
    """

    def __init__(self, fanpin, heatpin):
        """
        We are using board PIN numbering (as opposed to chip's numbers)
        """
        GPIO.setmode(GPIO.BOARD)
        GPIO.setup(fanpin, GPIO.OUT)
        GPIO.setmode(GPIO.BOARD)
        GPIO.setup(heatpin, GPIO.OUT)
		
    def LowTemp_mode(self):
        self.setHEAT_Status(1)
    def NormalTemp_mode(self):
        self.setHEAT_Status(0)
    def HighTemp_mode(self):
        self.setHEAT_Status(0)

    def setFAN_Status(self, state):
        if int(state) == 0 :
                self.set_off(_FAN_PIN)
                print('FAN status:'+str(state))
                
        else:
                self.set_on(_FAN_PIN)
                print('FAN status:'+str(state))
		
    def setHEAT_Status(self, state):
        if int(state) == 0 :
                self.set_off(_HEAT_PIN)
                print('Heat status:'+str(state))
                
        else:
                self.set_on(_HEAT_PIN)
                print('Heat status:'+str(state))

    def set_on(self,_INPIN):
        GPIO.setmode(GPIO.BOARD)
        GPIO.output(_INPIN, True)

    def set_off(self,_INPIN):
        GPIO.setmode(GPIO.BOARD)
        GPIO.output(_INPIN, False)

#
# Class LCD to be deleted if not used
#
class Lcd(object):
    LCD_RS = 23
    LCD_E = 24
    LCD_D4 = 25
    LCD_D5 = 22
    LCD_D6 = 17
    LCD_D7 = 27
    LCD_WIDTH = 20
    LCD_CHR = True
    LCD_CMD = False
    LCD_LINE_1 = 0x80
    LCD_LINE_2 = 0xC0
    E_PULSE = 0.00005
    E_DELAY = 0.00005

    def __init__(self):
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.LCD_E, GPIO.OUT)
        GPIO.setup(self.LCD_RS, GPIO.OUT)
        GPIO.setup(self.LCD_D4, GPIO.OUT)
        GPIO.setup(self.LCD_D5, GPIO.OUT)
        GPIO.setup(self.LCD_D6, GPIO.OUT)
        GPIO.setup(self.LCD_D7, GPIO.OUT)
        self.lcd_init()

    def lcd_init(self):
        self.write_byte(0x33, self.LCD_CMD)
        self.write_byte(0x32, self.LCD_CMD)
        self.write_byte(0x28, self.LCD_CMD)
        self.write_byte(0x0C, self.LCD_CMD)
        self.write_byte(0x06, self.LCD_CMD)
        self.write_byte(0x01, self.LCD_CMD)

    def toggle_enable(self):
        time.sleep(self.E_DELAY)
        GPIO.output(self.LCD_E, True)

        time.sleep(self.E_PULSE)

        GPIO.output(self.LCD_E, False)
        time.sleep(self.E_DELAY)

    def write_4bits(self, bits):
        GPIO.output(self.LCD_D4, False)
        GPIO.output(self.LCD_D5, False)
        GPIO.output(self.LCD_D6, False)
        GPIO.output(self.LCD_D7, False)

        if bits & 0x01 == 0x01:
            GPIO.output(self.LCD_D4, True)
        if bits & 0x02 == 0x02:
            GPIO.output(self.LCD_D5, True)
        if bits & 0x04 == 0x04:
            GPIO.output(self.LCD_D6, True)
        if bits & 0x08 == 0x08:
            GPIO.output(self.LCD_D7, True)

    def write_byte(self, bits, mode):
        GPIO.setmode(GPIO.BCM)
        GPIO.output(self.LCD_RS, mode)

        self.write_4bits((bits & 0xf0) >> 4)
        self.toggle_enable()

        self.write_4bits(bits & 0x0f)
        self.toggle_enable()

    def write_string(self, message):
        msg = message.ljust(self.LCD_WIDTH, ' ')[:self.LCD_WIDTH]
        for ch in msg:
            self.write_byte(ord(ch), self.LCD_CHR)

#
# main
#
if __name__ == '__main__' :
    log.startLogging(sys.stdout)

    led = LedDevice(_LED_PIN)
    # Blink on start to ensure device is working
    #led.blink(3)
    #lcd = Lcd()
    relays = RelayDevice(_FAN_PIN,_HEAT_PIN)
    temp_sensor = TempSensor(_W1_FILENAME, relays)

    device = RasPiApp(led, temp_sensor, relays)

    #led_factory = devicehive.auto.AutoFactory(device)
    led_factory = devicehive.poll.PollFactory(device)

    led_factory.connect(_API_URL)   

    # off we go!
    reactor.run()
    gsettings.close()

