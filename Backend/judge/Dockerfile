FROM ubuntu:22.04

RUN apt update && apt install -y \
    g++ \
    python3 \
    nodejs \
    default-jdk \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app