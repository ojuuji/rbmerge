#! /bin/bash -eu

Die()
{
	echo "$ME: $*" >&2
	exit 1
}

Expectation()
{
	grep -vPx '#.*|\s*' "${WORKDIR}/${1}.expected" | sort
}

CheckPrints()
{
	echo ":: checking prints ..."

	# grep all part_num which contain "pr" anywhere, except at the beginning, and do not end with "pr<num>"
	grep -Eo '^[^,]+' "${SQLDIR}/tables/parts.csv" | grep .pr | grep -vP 'pr\d+$' | while read part_num; do
		# ignore the ones which are already marked as prints
		grep -Pq "^P,${part_num}," "${SQLDIR}/tables/part_relationships.csv" || echo "$part_num"
	done | diff - <(Expectation nonstandard_pr)
}

CheckPatterns()
{
	echo ":: checking patterns ..."

	# grep all part_num which contain "pat" anywhere, except at the beginning, and do not end with "pat<num>[pr<num>]"
	grep -Eo '^[^,]+' "${SQLDIR}/tables/parts.csv" | grep .pat | grep -vP 'pat\d+(pr\d+)?$' | while read part_num; do
		# ignore the ones which are already marked as prints or patterns
		grep -Pq "^[PT],${part_num}," "${SQLDIR}/tables/part_relationships.csv" || echo "$part_num"
	done | diff - <(Expectation nonstandard_pat)
}

CheckMinifigs()
{
	echo ":: checking minifigs ..."
	diff <(grep -Po '^97[03][a-z]' "${SQLDIR}/tables/parts.csv" | sort -u) <(Expectation minifigs)
}

ME_FULLPATH="$(readlink -f "$BASH_SOURCE")"
ME="$(basename "$ME_FULLPATH")"
WORKDIR="$(dirname "$ME_FULLPATH")"
SQLDIR="${WORKDIR}/../sqlite"

export LC_ALL=C

CheckPrints
CheckPatterns
CheckMinifigs

echo ":: done"