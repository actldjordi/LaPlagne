cd devicehive/examples/
sed "s/_DeviceID=[a-z0-9\-\'].*/_DeviceID=\'9f33566e-1f8f-11e2-8979-c42c030ddb$1\'/g" tempcontrol_Lapl.py > tempcontrol_Lapl2.py
sed "s/_DeviceNAME=[a-z0-9\-\'].*/_DeviceNAME=\'device$1\'/g" tempcontrol_Lapl2.py > tempcontrol_Lapl.py
rm tempcontrol_Lapl2.py
