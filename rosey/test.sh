#!/usr/bin/env bash

cargo build
if [ -z "$1" ]; then
    TEST_BINARY=./target/debug/rosey npx -y humane@latest
else
    TEST_BINARY=./target/debug/rosey npx -y humane@latest --name "$1"
fi
