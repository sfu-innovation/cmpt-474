FROM stackbrew/ubuntu:saucy

# Clear out the existing sources list
RUN echo "" > /etc/apt/sources.list

# Use SFU ITS for better performance
RUN echo "deb http://mirror.its.sfu.ca/mirror/ubuntu/ saucy main restricted universe multiverse" >> /etc/apt/sources.list
RUN echo "deb http://mirror.its.sfu.ca/mirror/ubuntu/ saucy-updates main restricted universe multiverse" >> /etc/apt/sources.list
RUN echo "deb http://mirror.its.sfu.ca/mirror/ubuntu/ saucy-security main restricted universe multiverse" >> /etc/apt/sources.list

# Ubuntu goes insane in LXC if you don't hold these back
RUN apt-mark hold initscripts udev plymouth mountall

# Make sure everything is up-to-date
RUN apt-get update
RUN apt-get upgrade -y

# Install some essentials
RUN apt-get install -y \
	redis-server \
	nodejs \
	python-pip 
RUN pip install redis bottle mimeparse termcolor requests

# Copy in the evaluation script and make it runnable
ADD ./evaluate.sh /evaluate.sh
RUN chmod +x /evaluate.sh

# Use it as the entrypoint
ENTRYPOINT /evaluate.sh
