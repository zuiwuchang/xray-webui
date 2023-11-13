#!/usr/bin/env bash
set -e

BashDir=$(cd "$(dirname $BASH_SOURCE)" && pwd)
eval $(cat "$BashDir/conf.sh")
if [[ "$Command" == "" ]];then
    Command="$0"
fi

function help(){
    echo "docker build helper"
    echo
    echo "Usage:"
    echo "  $Command [flags]"
    echo
    echo "Flags:"
    echo "  -p, --push           push to hub"
    echo "  -h, --help          help for $Command"
}


ARGS=`getopt -o hp --long help,push -n "$Command" -- "$@"`
eval set -- "${ARGS}"
go=0
push=0
while true
do
    case "$1" in
        -h|--help)
            help
            exit 0
        ;;
        -g|--go)
            go=1
            shift
        ;;
        -p|--push)
            push=1
            shift
        ;;
        --)
            shift
            break
        ;;
        *)
            echo Error: unknown flag "$1" for "$Command"
            echo "Run '$Command --help' for usage."
            exit 1
        ;;
    esac
done

cd "$Dir/docker"
mkdir "$Dir/docker/root/opt/xray-webui/xray" -p
cp "$Dir/bin/xray/xray" "$Dir/docker/root/opt/xray-webui/xray/" 
cp "$Dir/bin/xray/geoip.dat" "$Dir/docker/root/opt/xray-webui/xray/" 
cp "$Dir/bin/xray/geosite.dat" "$Dir/docker/root/opt/xray-webui/xray/" 

cp "$Dir/bin/xray-webui" "$Dir/docker/root/opt/xray-webui/" 
rm "$Dir/docker/root/opt/xray-webui/js" -rf
cp "$Dir/bin/js" "$Dir/docker/root/opt/xray-webui/js"  -r

args=(
    sudo docker build -t "\"$Docker:$Version\"" .
)
exec="${args[@]}"
echo $exec
eval "$exec"

if [[ "$push" == 1 ]];then
    args=(
        sudo docker push "\"$Docker:$Version\""
    )
    exec="${args[@]}"
    echo $exec
    eval "$exec"
fi