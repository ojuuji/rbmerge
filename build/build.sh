#! /bin/bash -eu

Die()
{
	echo "$ME: $*" >&2
	exit 1
}

Verify()
{
	echo ":: verifying ..."

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

Build()
{
	local source="${WORKDIR}/../rbmerge.base.js"
	local target="${WORKDIR}/rbmerge.js"

	local first_line=$(grep -n 'const partsData = ' "$source" | grep -Po '^\d+')
	[[ $first_line -gt 0 ]] || Die "failed to get index of first line to replace"

	local last_line=$(grep -n 'const colorsData = ' "$source" | grep -Po '^\d+')
	[[ $last_line -gt 0 ]] || Die "failed to get index of last line to replace"

	head -n$((first_line-1)) "$source" > "$target"

	echo ":: building parts ..."

	echo -en '\t\tconst partsData = "' >> "$target"
	sed -r '1d; s/(,[^,]+){2}$//; s/"//g' "${WORKDIR}/../data/parts.csv" | while IFS=, read -r part_num name; do
		echo "${part_num},${name}"
	done | gzip -9n | base64 -w0 >> "$target"
	echo '";' >> "$target"

	echo ":: building part relationships ..."

	echo -en '\t\tconst relsData = "' >> "$target"
	tail -n+2 "${WORKDIR}/../data/part_relationships.csv" | gzip -9n | base64 -w0 >> "$target"
	echo '";' >> "$target"

	echo -en '\t\tconst relsExData = "' >> "$target"
	tail -n+2 "${WORKDIR}/../data/part_relationships_ex.csv" | gzip -9n | base64 -w0 >> "$target"
	echo '";' >> "$target"

	echo ":: building colors ..."

	echo -en '\t\tconst colorsData = "' >> "$target"
	tail -n+2 "${WORKDIR}/../data/colors.csv" | while IFS=, read -r id name rgb is_trans; do
		echo "${name},${rgb}"
	done | gzip -9n | base64 -w0 >> "$target"
	echo '";' >> "$target"

	tail -n+$((last_line+1)) "$source" >> "$target"
}

ME_FULLPATH="$(readlink -f "$BASH_SOURCE")"
ME="$(basename "$ME_FULLPATH")"
WORKDIR="$(dirname "$ME_FULLPATH")"

which base64 gzip > /dev/null

Verify
Build

echo ":: done"
