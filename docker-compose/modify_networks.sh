#!/bin/bash

# How to run: chmod +x modify_networks.sh && ./modify_networks.sh MCH-Mainnet
# this script modify ./envs/common-blockscout.env SUPPORTED_CHAINS, SUBNETWORK

# default value
default_networks_json_url="https://oasys-blockscout-networks.s3.ap-northeast-1.amazonaws.com/networks.json"
default_network_name="HUB-Mainnet"

# network name
echo "arg $1"
if [ -z "$1" ]; then
  echo "1 Default network name: $default_network_name"
  set -- "$default_network_name" "$2"
fi

# network json file url
if [ -z "$2" ]; then
  echo "Using default networks json file at: $default_networks_json_url"
  set -- "$1" "$default_networks_json_url"
fi

echo "Arguments: $@"

SUPPORTED_CHAINS="$(curl -s "$default_networks_json_url")"
SUBNETWORK="$1" #
echo "SUPPORTED_CHAINS $SUPPORTED_CHAINS"
echo "SUBNETWORK $SUBNETWORK"

sed -i "s|^SUPPORTED_CHAINS=.*|SUPPORTED_CHAINS=${SUPPORTED_CHAINS}|" ./envs/common-blockscout.env
sed -i "s|^SUBNETWORK=.*|SUBNETWORK=${SUBNETWORK}|" ./envs/common-blockscout.env
