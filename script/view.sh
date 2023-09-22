#!/usr/bin/env bash

set -e

BashDir=$(cd "$(dirname $BASH_SOURCE)" && pwd)
eval $(cat "$BashDir/conf.sh")
if [[ "$Command" == "" ]];then
    Command="$0"
fi

function help(){
    echo "static build helper"
    echo
    echo "Usage:"
    echo "  $Command [flags]"
    echo
    echo "Flags:"
    echo "  -s, --static        build static"
    echo "  -h, --help          help for $Command"
}

ARGS=`getopt -o hi:s --long help,i18n:,static -n "$Command" -- "$@"`
eval set -- "${ARGS}"
static=0
while true
do
    case "$1" in
        -h|--help)
            help
            exit 0
        ;;
        -s|--static)
            static=1
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

function build_static(){
    cd "$Dir"

    local dst="static/view"
    if [ -d "$dst" ];then
        rm "$dst" -rf
    fi
    local src="view/dist/view"
    echo cp "\"$src\"" "\"$dst\"" -r
    cp "$src" "$dst" -r
}

if [[ $static == 1 ]];then
    build_static
    exit $?
fi

cd "$Dir/view"
args=(
 ng build 
 --configuration production
)
exec="${args[@]}"
echo $exec
eval "$exec"