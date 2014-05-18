#!/bin/sh
DIR=`dirname $0`

java -jar "$JSDOC_HOME/jsrun.jar" "$JSDOC_HOME/app/run.js" \
    -t="$JSDOC_HOME/templates/jsdoc" \
    -r=10 \
    -v \
    -D="copyright:2011 Ryan Williams" \
    -d="docs" \
    "$DIR/../src/"
