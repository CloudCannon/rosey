#!/usr/bin/env bash

cargo build --release
if [ -z "$1" ]; then
    TEST_BINARY=./target/release/rosey npx -y humane@latest
else
    TEST_BINARY=./target/release/rosey npx -y humane@latest --name "$1"
fi
