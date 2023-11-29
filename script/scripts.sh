#!/usr/bin/env bash

set -e

BashDir=$(cd "$(dirname $BASH_SOURCE)" && pwd)
eval $(cat "$BashDir/conf.sh")
if [[ "$Command" == "" ]];then
    Command="$0"
fi

function help(){
    echo "pack scripts"
    echo
    echo "Usage:"
    echo "  $Command [flags]"
    echo
    echo "Flags:"
    echo "  -o, --output          pack output name"
    echo "  -h, --help          help for $Command"
}

ARGS=`getopt -o ho --long help,output: -n "$Command" -- "$@"`
eval set -- "${ARGS}"
pack="gz"
output=""
while true
do
    case "$1" in
        -h|--help)
            help
            exit 0
        ;;
        -o|--output)
            output="$2"
            shift 2
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

cd bin
if [[ "$output" == "" ]];then
    output="scripts-`date +%F`.tar.gz"
fi
tar -zcvf  "$output" js ts main.d.ts tsconfig.json
sha256sum "$output" > "$output.sha256.txt"
echo
echo pack to "\"$output\"" successed