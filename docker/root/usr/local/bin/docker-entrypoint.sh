#!/bin/bash
set -e
if [[ "$@" == "default-command" ]];then
    # import init settings
    if [[ ! -f  /data/xray.db ]]; then
        if [[ "$XRAY_IMPORT" != "" ]]; then
            /opt/xray-webui/xray-webui import -j "$XRAY_IMPORT" -d /data/xray.db
        fi
    fi
    if [[ "$XRAY_ADDR" == "" ]];then
        exec /opt/xray-webui/xray-webui web
    else
        exec /opt/xray-webui/xray-webui web -a "$XRAY_ADDR"
    fi
else
    exec "$@"
fi