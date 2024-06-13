#! /bin/bash

set -eu

cd "$(dirname "$(readlink -f "$BASH_SOURCE")")"

if [[ -f rb.db ]]; then
	echo ":: skipped downloading (already exists) rb.db"
else
	echo ":: downloading rb.db ..." 
	curl -LO https://github.com/ojuuji/rb.db/releases/download/latest/rb.db.xz
	xz -kd rb.db.xz
fi
