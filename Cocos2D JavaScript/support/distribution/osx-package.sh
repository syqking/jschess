#!/bin/bash

test -z "$1" && {
  echo "No package name specified"
  exit 1
}

echo "Creating package: $1"

# Create the output folder
mkdir -p build/dmg

# Delete old DMG
if [ -f "build/$1.dmg" ]
then
  rm "build/$1.dmg"
fi


# Create the .pkg
/Developer/Applications/Utilities/PackageMaker.app/Contents/MacOS/PackageMaker \
    -v \
    -d "OSX Package.pmdoc" \
    -o "build/dmg/$1.pkg" \
    -x /\.DS_Store$ \
    -x \.swp$ \
    -x \.swo$ \
    -x /\._.* \
    -x /\.git$ \
    -x /\.gitmodules$ \
    -x /\.gitignore$ \
    -x /\.npmignore$ \
    -x /bin/.*\.exe$ \
    -x /bin/.*\.bat$ \
    -x /support/distribution \
    -x /support/win32 \
    -x /support/node-builds/node-\(linux\|cygwin\|sunos\) \
    -x /support/node-builds/.*\.dll \
    -x /docs \
    -x /tests/build


# Create the DMG
./yoursway-create-dmg/create-dmg --volname "$1" --background ./osx_dmg_bg.png --window-size 640 400 --icon-size 128 --icon "$1.pkg" 440 200 "build/$1.dmg" ./build/dmg/
