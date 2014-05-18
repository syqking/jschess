#!/bin/sh -e
# lets check if we have the submodules initialized

if [ -h $0 ]; then
    DIR=$(dirname $(readlink $0))
else
    DIR=$(dirname $0)
fi

if which node > /dev/null
then
    # User has node installed, use that
    node "$DIR/cocos.js" "$@"
else
    # User doesn't have node installed, fallback to precompiled binaries
    case `uname -a` in
    Linux*x86_64*)
        "$DIR/../support/node-builds/node-linux64" "$DIR/cocos.js" "$@" 
        ;;

    Linux*i686*)
        "$DIR/../support/node-builds/node-linux32" "$DIR/cocos.js" "$@"
        ;;
        
    Darwin*)
        "$DIR/../support/node-builds/node-darwin" "$DIR/cocos.js" "$@"
        ;;
        
    SunOS*)
        "$DIR/../support/node-builds/node-sunos" "$DIR/cocos.js" "$@"
        ;;

    CYGWIN*)
        "$DIR/../support/node-builds/node-cygwin.exe" "$DIR/cocos.js" "$@"
        ;;

    MING*)
        "$DIR/../support/node-builds/node-cygwin.exe" "$DIR/cocos.js" "$@"
        ;;    

    *) echo "Unknown OS and Node isn't installed. Can't continue."
       ;;
    esac
fi
