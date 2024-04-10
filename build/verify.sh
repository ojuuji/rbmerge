#! /bin/bash -eu

Die()
{
	echo "$ME: $*" >&2
	exit 1
}

Max()
{
	local res="" arg
	for arg in "$@"; do
		if [[ -z $res || $res -lt $arg ]]; then
			res="$arg"
		fi
	done
	echo $res
}

VerifyColors()
{
	echo ":: verifying colors ..."

	local threshold="$(grep -Po 'const grayThreshold = \K\d+' "${WORKDIR}/../rbmerge.base.js")"
	[[ $threshold -gt 0 ]] || Die "failed to get grayThreshold"

	tail -n+2 "${WORKDIR}/../data/colors.csv" | while IFS=, read -r id name rgb is_trans; do
		local r="$((16#${rgb:0:2}))"
		local g="$((16#${rgb:2:2}))"
		local b="$((16#${rgb:4:2}))"
		local diff1="$((r-g))"
		local diff2="$((r-b))"
		local diff3="$((g-b))"
		local diffmax="$(Max "${diff1#-}" "${diff2#-}" "${diff3#-}")"
		if [[ $diffmax -le $threshold ]]; then
			echo "$name,$rgb"
		fi
	done | diff - "${WORKDIR}/fixed_colors.expected"
}

VerifyPrints()
{
	echo ":: verifying prints ..."

	# grep all part_num which contain "pr" anywhere, except at the beginning, and do not end with "pr<num>"
	grep -Eo '^[^,]+' "${WORKDIR}/../data/parts.csv" | grep '.pr' | grep -vP 'pr\d+$' | while read part_num; do
		# ignore the ones which are already marked as prints
		grep -Pq "^P,${part_num},\K.+" "${WORKDIR}/../data/part_relationships.csv" || echo "$part_num"
	done | diff - <(grep -vPx '#.*|\s*' "${WORKDIR}/alnum_pr.expected")
}

ME_FULLPATH="$(readlink -f "$BASH_SOURCE")"
ME="$(basename "$ME_FULLPATH")"
WORKDIR="$(dirname "$ME_FULLPATH")"

VerifyColors
VerifyPrints

echo ":: done"
