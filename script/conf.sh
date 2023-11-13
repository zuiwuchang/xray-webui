Target="xray-webui"
Docker="github.com/zuiwuchang/xray-webui"
Dir=$(cd "$(dirname $BASH_SOURCE)/.." && pwd)
Version="v0.0.2"
View=1
Platforms=(
    darwin/amd64
    windows/amd64
    linux/arm
    linux/amd64
)
UUID="ee7bc200-56c8-11ee-90cf-87199c7646f0"
Protos=(
    settings/settings.proto
)