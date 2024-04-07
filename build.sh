#! /bin/bash -eu

Die()
{
	echo "$ME: $*" >&2
	exit 1
}

Synopsis()
{
	echo "usage: $ME fetch|verify|build|all" >&2
}

Fetch()
{
	local datadir="${WORKDIR}/data" file
	for file in parts.csv part_relationships.csv colors.csv; do
		echo ":: fetching $file ..."
		curl -s "https://cdn.rebrickable.com/media/downloads/$file.gz" -o "${datadir}/${file}.gz"
		gunzip -f "${datadir}/${file}.gz"
	done
}

Verify()
{
	echo ":: verifying ..."

	[[ "part_num,name,part_cat_id,part_material" == "$(head -1 "${WORKDIR}/data/parts.csv")" ]] || Die "unexpected structure of parts.csv"
	[[ "rel_type,child_part_num,parent_part_num" == "$(head -1 "${WORKDIR}/data/part_relationships.csv")" ]] || Die "unexpected structure of part_relationships.csv"
	[[ "id,name,rgb,is_trans" == "$(head -1 "${WORKDIR}/data/colors.csv")" ]] || Die "unexpected structure of colors.csv"

	local threshold="$(grep -Po 'const grayThreshold = \K\d+' "${WORKDIR}/rbmerge.base.js")"
	[[ $threshold -gt 0 ]] || Die "failed to get grayThreshold"

	tail -n+2 "${WORKDIR}/data/colors.csv" | while IFS=, read -r id name rgb is_trans; do
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
	done | diff - "${WORKDIR}/data/fixed_colors.expected"
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
	local source="${WORKDIR}/rbmerge.base.js"
	local target="${WORKDIR}/rbmerge.js"

	local first_line=$(grep -n 'let parts = "<' "$source" | grep -Po '^\d+')
	[[ $first_line -gt 0 ]] || Die "failed to get index of first line to replace"

	local last_line=$(grep -n 'let colors = "<' "$source" | grep -Po '^\d+')
	[[ $last_line -gt 0 ]] || Die "failed to get index of last line to replace"

	head -n$((first_line-1)) "$source" > "$target"

	echo ":: building parts ..."

	echo -en '\t\tlet parts = "' >> "$target"
	sed -r '1d; s/(,[^,]+){2}$//; s/"//g' "${WORKDIR}/data/parts.csv" | while IFS=, read -r part_num name; do
		echo -n "${part_num},${name}\\n" >> "$target"
	done
	echo -e '".trim().split("\\n");\n' >> "$target"

	echo ":: building part relationships ..."

	echo -en '\t\tlet rels = "' >> "$target"
	tail -n+2 "${WORKDIR}/data/part_relationships.csv" | while IFS=, read -r rel_type child_part_num parent_part_num; do
		echo -n "${rel_type},${child_part_num},${parent_part_num}\\n" >> "$target"
	done
	echo -e '".trim().split("\\n");\n' >> "$target"

	echo -en '\t\tlet relsEx = String.raw`' >> "$target"
	tail -n+2 "${WORKDIR}/data/part_relationships_ex.csv" | while IFS=, read -r rel_type child_part_num_regex parent_part_num; do
		echo -n "${rel_type},${child_part_num_regex},${parent_part_num}\\n" >> "$target"
	done
	echo -e '`.split("\\\\n").filter(Boolean);\n' >> "$target"

	echo ":: building colors ..."

	echo -en '\t\tlet colors = "' >> "$target"
	tail -n+2 "${WORKDIR}/data/colors.csv" | while IFS=, read -r id name rgb is_trans; do
		echo -n "${name},${rgb}\\n" >> "$target"
	done
	echo '".trim().split("\n");' >> "$target"

	tail -n+$((last_line+1)) "$source" >> "$target"
}

ME_FULLPATH="$(readlink -f "$BASH_SOURCE")"
ME="$(basename "$ME_FULLPATH")"
WORKDIR="$(dirname "$ME_FULLPATH")"

for EXE in curl diff gunzip; do
	which $EXE > /dev/null
done
unset EXE

[[ $# -ne 0 ]] || { Synopsis; Die "no command provided"; }
[[ $# -eq 1 ]] || { Synopsis; Die "expected one command but given $#"; }

case "$1" in
	all)
		Fetch
		Verify
		Build
		;;
	build)
		Build
		;;
	fetch)
		Fetch
		;;
	verify)
		Verify
		;;
	*)
		Synopsis
		Die "invalid command: $1"
		;;
esac

echo ":: done"
