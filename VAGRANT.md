# Running in a Virtual Machine with VirtualBox + Vagrant

You can run it in a Virtual Machine with Vagrant and VirtualBox
 
## Dependencies

- [Oracle VM VirtualBox](https://www.virtualbox.org/)
- [Vagrant](https://www.vagrantup.com/)
- Vagrant VB Guest Additions
- Vagrant Hosts File Updater

> tested on windows 10 professional

```bash
vagrant plugin install vagrant-vbguest
vagrant plugin install vagrant-hostsupdater
```

### Your hosts file
 
The Vagrant Hosts Updater creates a new line in the hosts file.
It works only if you change the permission for your hosts file.
The easiest way in windows 10 is: drop it and create a new one without inheriting the rights
from the upper folder.

### Init

```bash
# get it
cd /somewhere/on/my/disk
git clone https://github.com/seekwhencer/node-playlist-automation-ng.git station
cd station
```

### Shared folders

The machine have two shared folder:

 - the app
 - the audio files
 
The app folder is fixed BUT the **audio folder** is NOT SET by default.
To set one, open the `Vagrantfile` change this line and point it to
a folder on your disk where the mp3 files are stored.

```
config.vm.synced_folder "CHANGE/ME", "/data/audio", id: "audio-folder", owner: "vagrant", group: "vagrant", mount_options: ["dmode=775,fmode=664"]
```

Set you LAN IP of the VM. The first two blocks must be the same from your local IP.

```
config.vm.network "private_network", ip: "192.168.44.10"
```


Then you can run it:

```bash
# run it
vagrant up
```

> HINT: after a machine reboot (`sudo reboot now`), on windows it could be that all shared folder are not mounted.
> For that, enter: `vagrant reload`

### Done

- ... or not. Before a `vagrant up` you can check the `Vagrantfile`. Change things like: `config.vm.network` or `v.memory` or `v.cpus` - if you want.
It's not a must.
- On a first run the machine installs all needs with an [ansible](https://www.ansible.com/) playbook.
 
If the machine is up, you can:

```bash
vagrant ssh
```
 
Then look for the running app with pm2:
```bash
pm2 ls
```
 
After a complete reboot of the machine, the node.js app goes in a running state.
 
To save the state and suspend the machine, enter:
 
```bash
# suspend the machine
vagrant suspend
 
# awake the machine
vagant resume
 
# destroy and re-up
vagrant destroy --force && vagrant up
```

> HINT: If you are starting and stopping and starting and stopping the node app - it could be, that node says on any port: `ADDRINUSE`.
> On this point anything is crashed. Do a `sudo reboot now` - and all is fine.