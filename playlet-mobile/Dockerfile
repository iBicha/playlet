FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y curl unzip software-properties-common

# Install Nodejs
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Install JDK
RUN apt-get install -y openjdk-17-jdk

# Install Android SDK
ENV ANDROID_HOME=/usr/lib/android-sdk
ENV ANDROID_SDK_ROOT=$ANDROID_HOME \
    PATH=${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator

# comes from https://developer.android.com/studio/#command-tools
ENV ANDROID_SDK_TOOLS_VERSION 9477386
RUN curl -sL https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_SDK_TOOLS_VERSION}_latest.zip -o /tmp/cmdline-tools.zip && \
    mkdir -p $ANDROID_HOME/cmdline-tools && \
    unzip -q /tmp/cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools && \
    rm /tmp/cmdline-tools.zip && \
    mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest

RUN yes | sdkmanager --licenses

# Install Android SDK components
RUN yes | sdkmanager \
    "platform-tools" \
    "platforms;android-33" \
    "build-tools;33.0.2" \
    "emulator"

# Install NativeScript
RUN npm install -g nativescript

WORKDIR /app

ENTRYPOINT ["/bin/bash", "/app/docker-entrypoint.sh"]