#! /bin/bash

set -eu

cd "$(dirname "$(readlink -f "$BASH_SOURCE")")"
DBDIR="../../../tables"

"${DBDIR}/download.sh"

for sql in *.sql; do
	json="$(basename "$sql" .sql).json"
	echo ":: generating $json ..."
	sqlite3 "${DBDIR}/rb.db" < "$sql" > "$json"
done
