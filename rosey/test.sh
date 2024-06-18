#!/usr/bin/env bash

cargo build
if [ -z "$1" ]; then
    TEST_BINARY=./target/debug/rosey npx -y humane@v0.3.12
else
    TEST_BINARY=./target/debug/rosey npx -y humane@v0.3.12 --name "$1"
fi
