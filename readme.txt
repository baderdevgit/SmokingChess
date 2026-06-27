To Run:
-------
-1st: Run the MQTT Server with config commands
    mosquitto -c mosquitto.conf -v
-2nd: Run the Node Server



Troubleshooting:
----------------
-To restart mosquitto: taskkill /F /IM mosquitto.exe 
-To manually verify mosquitto messages: mosquitto_sub -h localhost -t "#" -v
-If the network's firewall won't allow mqtt messages or node connections:    
    New-NetFirewallRule -DisplayName "Node Server 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
    New-NetFirewallRule -DisplayName "Mosquitto 1883" -Direction Inbound -Protocol TCP -LocalPort 1883 -Action Allow