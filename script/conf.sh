Target="xray-webui"
Docker="king011/xray-webui"
Dir=$(cd "$(dirname $BASH_SOURCE)/.." && pwd)
Version="v0.0.5"
View=1
Platforms=(
    darwin/amd64
    windows/amd64
    linux/arm
    linux/amd64
)