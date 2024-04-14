#! /bin/bash -eu

UpdatePartRelationships()
{
	echo ":: updating part relationships ..."

	declare -A YEAR_MIN=() YEAR_MAX=()

	while IFS=\| read -u3 part_num year_min year_max; do
		YEAR_MIN["$part_num"]="$year_min"
		YEAR_MAX["$part_num"]="$year_max"
	done 3< <(sqlite3 "${SQLDIR}/dist/bricks.db" <<-EOF
		  with part_years as (
			       /* parts from sets */
			select sets.year year, ip.part_num part_num
			  from sets
			  join inventories i
			    on i.set_num = sets.set_num
			  join inventory_parts ip
			    on ip.inventory_id = i.id
			 union
			       /* parts from minifigs included in the sets */
			select sets.year year, ip_fig.part_num part_num
			  from sets
			  join inventories i
			    on i.set_num = sets.set_num
			  join inventory_minifigs im
			    on im.inventory_id = i.id
			  join inventories i_fig
			    on i_fig.set_num = im.fig_num
			  join inventory_parts ip_fig
			    on ip_fig.inventory_id = i_fig.id
		)
		select part_num, min(year), max(year)
		  from part_years
		 group by part_num
		EOF
	)

	all_molds=""
	while IFS=, read -u3 rel_type child_part_num parent_part_num; do
		if [[ "$rel_type" != "M" ]]; then
			echo "$rel_type,$child_part_num,$parent_part_num"
			continue
		fi

		[[ "$all_molds" != *"'$child_part_num'"* ]] || continue

		declare -A molds=([$child_part_num]=1 [$parent_part_num]=1)
		prev_count=0

		while [[ "$prev_count" -ne "${#molds[@]}" ]]; do
			prev_count=${#molds[@]}

			filter="$(printf "'%s'," "${!molds[@]}")"
			filter="${filter%,}"

			while IFS=\| read -u4 a b; do
				molds+=(["$a"]=1 ["$b"]=1)
			done 4< <(sqlite3 "${SQLDIR}/dist/bricks.db" "select child_part_num c, parent_part_num p \
				from part_relationships where rel_type = 'M' and (c in ($filter) or p in ($filter))")
		done

		all_molds="$all_molds $filter"

		resolved_part=()
		resolved_year=0

		for part in "${!molds[@]}"; do
			if [[ -n "${YEAR_MAX["$part"]-}" ]]; then
				if [[ "$resolved_year" -lt "${YEAR_MAX["$part"]}" ]]; then
					resolved_year="${YEAR_MAX["$part"]}"
					resolved_part=("$part")

				elif [[ "$resolved_year" -eq "${YEAR_MAX["$part"]}" ]]; then
					resolved_part+=("$part")
				fi
			fi
		done

		if [[ "${#resolved_part[@]}" -gt 1 ]]; then  # more than one mold with the same max year
			# Pick the one with max YEAR_MIN. If there are multiple, take the smallest part_num
			read _ resolved_part < <(for part in "${resolved_part[@]}"; do echo "${YEAR_MIN["$part"]-0} $part"; done | sort -k1,1 -k2,2rV | tail -1)

		elif [[ "$resolved_year" -eq 0 ]]; then  # all molds are unused
			# Take the biggest part_num	
			resolved_part="$(printf "%s\n" "${!molds[@]}" | sort -V | tail -1)"
		fi

		for part in "${!molds[@]}"; do
			if [[ "$part" != "$resolved_part" ]]; then
				echo "M,$part,$resolved_part"
			fi
		done
	done 3< <(grep -E '^[AMPT]' "${SQLDIR}/tables/part_relationships.csv") | sort > "${WORKDIR}/rbm_part_relationships.csv"
}

ME_FULLPATH="$(readlink -f "$BASH_SOURCE")"
WORKDIR="$(dirname "$ME_FULLPATH")" 
SQLDIR="${WORKDIR}/../sqlite"

(cd "$SQLDIR" && make && make indices)

cp -f "${SQLDIR}/tables/colors.csv" "${WORKDIR}/rbm_colors.csv"
cp -f "${SQLDIR}/tables/parts.csv" "${WORKDIR}/rbm_parts.csv"

UpdatePartRelationships

echo ":: done"
