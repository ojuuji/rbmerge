#! /bin/bash

set -eu

cd "$(dirname "$(readlink -f "$BASH_SOURCE")")"

../tables/download.sh

TS1="$(git log -1 --format="%at" .)"
TS2="$(sqlite3 ../tables/rb.db "SELECT value FROM rb_db_lov WHERE key = 'data_timestamp'")"
[[ "$TS1" -gt "$TS2" ]] && TS="$TS1" || TS="$TS2"

VERSION="$(date --utc -d"@$TS" +%F.%H-%M-%S)"
echo ":: version generated: $VERSION"

PUBLIC_FILES="$(cd public && ls | grep -vFx index.html | tr '\n' ',' | sed 's/,$//')"
PUBLIC_REV="$(git log -1 --format="%H" public)"

cat <<EOF > .env.local
REACT_APP_VERSION=$VERSION
REACT_APP_PUBLIC_FILES=$PUBLIC_FILES
REACT_APP_PUBLIC_REV=$PUBLIC_REV
EOF
