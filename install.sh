#!/bin/sh

ROOT=`dirname $0`

# Give nodejs the ability to bind to ports below 1024.
# Since apparently you can't setcap on a user may as well
# give this power to ANYONE WITH THE NODE BINARY LOL.
sudo setcap cap_net_bind_service=ep /usr/bin/nodejs

# Fix some retardation. This is unbelievably annoying.
sudo cp "${ROOT}/share/lxc/fuck-lxc.conf" "/etc/init/fuck-lxc.conf"

# Think we good now
# Yea boi.
