#!/bin/bash

sudo sh -c 'echo "deb http://ppa.launchpad.net/ansible/ansible/ubuntu trusty main" >> /etc/apt/sources.list'
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 93C4A3FD7BB9C367 -y
sudo apt-get update -y
sudo apt-get install ansible -y

cd /data/station/ansible
sudo ansible-playbook -k ./raspberrypi.yml
