
# Random Notes

Clients (HTTP API requests from users)
Middleware (HTTP server, Redis client, ZMQ peer)
Backends (faulty Redis instances)


Clients make requests to username.cmpt474.innovate.csil.sfu.ca/app/api/...

- Student:
 - linear: cmpt474.innovate.csil.sfu.ca/tracks/2013-d100
 - exploratory: cmpt474.innovate.csil.sfu.ca/topics

- Student:
 - forks cmpt474-app to their local machine
 - git add remote sfu cmpt474.innovate.csil.sfu.ca/deploy
 - git push sfu master
 - go to cmpt474.innovate.csil.sfu.ca/analysis

package.json
{
	"name": "app",
	"deployment": {

	} 
}


bunch of redis instances as backend
use netem to simulate garbage networks

http://man7.org/linux/man-pages/man7/rtnetlink.7.html
http://man7.org/linux/man-pages/man3/rtnetlink.3.html

RTM_NEWLINK, RTM_DELLINK, RTM_GETLINK
create virtual network device, for app to use it

RTM_NEWQDISC, RTM_DELQDISC, RTM_GETQDISC
use netem qdisc to mess up the application's networking

Redis has:
GET
SET
DEL
MIGRATE

partitioning:
- your choice how you decide what kind of partition to use
 - list [ p0, p1, p2, ... ]
 - hash addressing key(xyz) -> p1

sudo apt-get install lxc
sudo service network-manager restart

# minimum jail required?
mkdir /var/run/jail/host
cp /var/run/jail/host/bin/node
ldd /usr/bin/node