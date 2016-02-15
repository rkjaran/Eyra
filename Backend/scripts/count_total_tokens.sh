#!/bin/bash

# Get the script directory
SDIR=$( dirname $( readlink -f $0 ) )
cd "$SDIR"

cd ../server-interface/recordings
ls -1 session_* | (expr $(wc -l) / 2 - $(ls . | wc -l))