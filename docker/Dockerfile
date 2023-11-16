FROM alpine:3.17.1

RUN apk add --no-cache \
    iptables iproute2 bash

Copy root /

RUN set -eux;  \
    chown root.root /opt/xray-webui -R; \
    chown root.root  /usr/local/bin/docker-entrypoint.sh; \
    chmod a+x /usr/local/bin/docker-entrypoint.sh;

WORKDIR /opt/xray-webui
ENTRYPOINT ["docker-entrypoint.sh"]
VOLUME /data

EXPOSE 1080
EXPOSE 8118
EXPOSE 80
CMD ["default-command"]