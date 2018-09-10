# Running on a Raspberry Pi

As i saw the Raspberry Pi i knew it: this is exactly my device for this kind of service.


## Setting up your RPI

- set hostname to: `station`
- set keyboard layout, timezone etc.
- enabling ssh
- set password for user `pi`
- set boot to console shell (disabling desktop boot)

## Installing Ansible
```
sudo apt-get install ansible -y
```

> With ansible all needed installations will be automated. You can drink a coffee when it runs.

Enter:
```bash
sudo mkdir /data && sudo chown pi:pi /data && cd /data
git clone https://github.com/seekwhencer/node-playlist-automation-ng.git station
cd station
sh ./install_raspberrypi.sh
```
