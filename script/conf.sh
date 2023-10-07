Target="xray_webui"
Docker="github.com/zuiwuchang/xray_webui"
Dir=$(cd "$(dirname $BASH_SOURCE)/.." && pwd)
Version="v0.0.1"
View=1
Platforms=(
    darwin/amd64
    windows/amd64
    linux/arm
    linux/amd64
)
UUID="ee7bc200-56c8-11ee-90cf-87199c7646f0"
Protos=(
    system/system.proto
    firewall/firewall.proto
    strategy/strategy.proto
)