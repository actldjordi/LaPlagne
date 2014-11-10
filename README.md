LaPlagne
========
rm /Users/SOUNDOFART_MBP15_JV/.ssh/known_hosts
Ssh pi@xxxxxx
git clone https://github.com/sjodriederedder/LaPlagne.git
mv -i /home/pi/LaPlagne/install/config.sh /home/pi/
mv -i /home/pi/LaPlagne/install/install.sh /home/pi
mv -i /home/pi/LaPlagne/install/rc.local /home/pi
mv -i /home/pi/LaPlagne/install/temp_laplagne.tar.gz /home/pi
chmod +x install.sh
chmod +x config.sh
bash install.sh
mv -i /home/pi/LaPlagne/Device/tempcontrol_Lapl.py /home/pi/devicehive/examples/
bash config.sh xx
