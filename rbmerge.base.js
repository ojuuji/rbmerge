var rbMerge = (function() {

const decompress = base64string => {
	const bytes = Uint8Array.from(atob(base64string), c => c.charCodeAt(0));
	const cs = new DecompressionStream('gzip');
	const writer = cs.writable.getWriter();
	writer.write(bytes);
	writer.close();
	return new Response(cs.readable).arrayBuffer().then(function (arrayBuffer) {
		return new TextDecoder().decode(arrayBuffer);
	});
};

const Rel = Object.freeze({
	Alt      : 'A',
	Mold     : 'M',
	Print    : 'P',
	Pattern  : 'T',
});

const Key = (partNum, rel) => `${partNum}:${rel}`;

class RBmerge {
	async init() {
		const relsData = "";    // <-- CAUTION! These lines are replaced
		const relsExData = "";  // <-- by the script with actual base64-
		const colorsData = "";  // <-- encoded then gzipped tables data

		// <rel_type>,<child_part_num>,<parent_part_num>\n...
		const rels = (await decompress(relsData)).trim().split('\n');
		for (const rel of rels) {
			let [type, child, parent] = rel.split(',')
			this.rels.set(Key(child, type), parent);
		}

		// <rel_type>,<child_part_num_regex>,<parent_part_num>\n...
		const relsEx = (await decompress(relsExData)).trim().split('\n');
		for (const rel of relsEx) {
			let [type, child, parent] = rel.split(',')
			this.relsEx.get(type).push({regex: new RegExp(`^${child}$`), partNum: parent});
		}

		// already sorted colors in form <name>\n...
		this.colors = (await decompress(colorsData)).trim().split('\n');
	}

	setup() {
		if (this.parse()) {
			this.resetTable();
			this.init().then(() => this.apply());
		}
	}

	parse() {
		let table = "";
		if (document.getElementsByTagName('table').length == 1) {
			table = document.getElementsByTagName('table')[0].innerHTML;
		}
		const thead = "<tr>\n<th>Image</th>\n<th>Part Num</th>\n<th>Quantity</th>\n<th>Color</th>\n<th>Description</th>\n</tr>\n";
		if (!table.includes(thead)) {
			document.getElementsByTagName('body')[0].innerHTML = `<h1 style='background-color: red; color: white'>${this.me}: document does not contain table in expected format`;
			return false;
		}

		const re = /<td>\s*(?<img><img.+?>)\s*<\/td>\s*<td>(?<partNum>[^<]+)<\/td>\s*<td>(?<count>\d+)<\/td>\s*<td>(?<color>[^<]+)<\/td>\s*<td>(?<name>[^<]+)<\/td>/g
		for (let match; (match = re.exec(table)) !== null; ) {
			const {groups: {img, partNum, count, color, name}} = match;
			const part = {
				img: img,
				partNum: partNum,
				refPartNum: partNum,
				count: Number(count),
				color: color,
				name: name,
				nameLowerCase: name.toLowerCase(),
				sortFactor: 0,
			};
			this.inventory.push(part);
		}

		return true;
	}

	resolve(part) {
		let found = new Set();
		let links = [
			[Rel.Print, 1000, document.getElementById('rbm_prints').checked],
			[Rel.Pattern, 100, document.getElementById('rbm_patterns').checked],
			[Rel.Alt, 10, document.getElementById('rbm_alts').checked],
			[Rel.Mold, 1, document.getElementById('rbm_molds').checked],
		];
		let resolveExtra = document.getElementById('rbm_extra').checked;
		while (true) {
			let resolved, resolvedSortFactor;
			for (const [rel, sortFactor, shouldResolve] of links) {
				if (shouldResolve) {
					resolved = this.rels.get(Key(part.refPartNum, rel));
					if (resolved === undefined && resolveExtra) {
						for (const {regex, partNum} of this.relsEx.get(rel)) {
							let replaced = part.refPartNum.replace(regex, partNum);
							if (replaced != part.refPartNum) {
								resolved = replaced;
								break;
							}
						}
					}
					if (resolved !== undefined) {
						resolvedSortFactor = sortFactor;
						break;
					}
				}
			}
			
			if (resolved === undefined) {
				return part;
			}
			if (found.has(resolved)) {
				console.log(`${this.me}: avoided circular reference involving parts ${part.refPartNum} and ${resolved}`);
				return part;
			}
			found.add(resolved);
			part.refPartNum = resolved;
			part.sortFactor += resolvedSortFactor;
		}
	}

	compareColors(l, r) {
		if (l !== r) {
			for (const color of this.colors) {
				if (color === l || color === r) {
					return color === l ? -1 : 1;
				}
			}
		}
		return 0;
	}

	apply() {
		let map = new Map();

		for (const part of this.inventory) {
			let resolved = this.resolve(structuredClone(part));

			let list = map.get(resolved.refPartNum);
			if (list === undefined) {
				list = [resolved];
			}
			else {
				list.push(resolved);
			}
			map.set(resolved.refPartNum, list);
		}

		this.merged = [...map.values()];
		this.mergedCount = 0;

		for (const group of this.merged) {
			group.sort((l, r) => l.sortFactor - r.sortFactor || l.partNum.localeCompare(r.partNum) || this.compareColors(l.color, r.color));
			group.forEach(part => this.mergedCount += part.count);
		}

		this.merged.sort((l, r) => {
			// Make it smarter a bit so that for example "Brick 1 x 2" comes _before_ "Brick 1 x 16"
			const lw = l[0].nameLowerCase.split(' ').reverse();
			const rw = r[0].nameLowerCase.split(' ').reverse();
			while (lw.length > 0 && rw.length > 0 && lw[lw.length - 1] == rw[rw.length - 1]) {
				lw.pop();
				rw.pop();
			}
			if (lw.length == 0 || rw.length == 0) {
				return lw.length != 0 ? 1 : rw.length != 0 ? -1 : 0;
			}
			const ln = parseInt(lw[lw.length - 1]);
			const rn = parseInt(rw[rw.length - 1]);
			if (!isNaN(ln) && !isNaN(rn)) {
				return ln - rn;
			}
			return lw[lw.length - 1].localeCompare(rw[rw.length - 1]);
		});

		this.filter(true);
	}

	filter(force = false) {
		const filter = new Set(document.getElementById("rbm_filter").value.toLowerCase().match(/\S+/g));
		if (!force && this.lastFilter !== undefined && filter.size === this.lastFilter.size && [...filter].every(x => this.lastFilter.has(x))) {
			return;
		}
		this.lastFilter = filter;

		if (filter.size === 0) {
			this.filtered = this.merged;
			this.filteredCount = this.mergedCount;
		}
		else {
			this.filtered = [];
			this.filteredCount = 0;

			for (const group of this.merged) {
				let groupFilter = [...filter];
				grouploop: for (const part of group) {
					for (let i = groupFilter.length - 1; i >= 0; i --) {
						if (part.nameLowerCase.includes(groupFilter[i])) {
							groupFilter.splice(i, 1);
							if (groupFilter.length == 0) {
								break grouploop;
							}
						}
					}
				}
				if (groupFilter.length == 0) {
					this.filtered.push(group);
					group.forEach(part => this.filteredCount += part.count);
				}
			}
		}

		this.render();
	}

	partAnchor(partNum) {
		return `<a href="https://rebrickable.com/parts/${partNum}/" target="_blank">${partNum}</a>`;
	}

	renderRow(group) {
		let count = 0;
		let colors = "";
		let colorsUniq = new Set();
		let countPerPartNum = new Map();
		// let prevPartNum = "";
		let prevSortFactor = 0;
		
		for (let i = 0; i < group.length; i++) {
			const part = group[i];
			count += part.count;
			
			if (i > 0) {
				// colors += prevPartNum != part.partNum ? "<hr>" : "<br>";
				colors += prevSortFactor != part.sortFactor ? "<hr>" : "<br>";
			}
			// prevPartNum = part.partNum;
			prevSortFactor = part.sortFactor;

			colors += `${part.img} ${part.count} ${part.color}`;
			colorsUniq.add(part.color);
			
			const partNumCount = countPerPartNum.has(part.partNum) ? countPerPartNum.get(part.partNum).count : 0;
			countPerPartNum.set(part.partNum, {count : part.count + partNumCount, name: part.name});
		}
		
		let total = `${count}`;
		if (colorsUniq.size > 1) {
			total += ` in ${colorsUniq.size} colors`;
		}

		let desc = "";
		if (countPerPartNum.size == 1) {
			if (group[0].partNum == group[0].refPartNum) {
				desc = group[0].name;
			}
			else {
				desc = `[${this.partAnchor(group[0].partNum)}] ${group[0].name}`;
			}
		}
		else for (const [partNum, value] of countPerPartNum) {
			if (desc.length > 0) {
				desc += "<br>";
			}
			desc += `${value.count} [${this.partAnchor(partNum)}] ${value.name}`;
		}

		return `<tr>\n<td>${this.partAnchor(group[0].refPartNum)}</td>\n<td>${total}</td>\n<td>\n${colors}\n</td>\n<td>${desc}</td>\n</tr>\n`;
	}

	resetTable() {
		document.getElementsByTagName('body')[0].innerHTML = '<div id="rbm_options"></div>' + document.getElementsByTagName('table')[0].outerHTML;
		document.getElementsByTagName('tbody')[0].innerHTML = "Loading ...";

		document.getElementById('rbm_options').innerHTML = `
<div style="padding: 9px">
<label style="display: inline">Merge: </label>
<label style="display: inline" for="rbm_prints"><input type="checkbox" id="rbm_prints" name="rbm_prints" checked/> prints</label>
<label style="display: inline" for="rbm_patterns"><input type="checkbox" id="rbm_patterns" name="rbm_patterns" checked/> patterns</label>
<label style="display: inline" for="rbm_molds"><input type="checkbox" id="rbm_molds" name="rbm_molds" checked/> molds</label>
<label style="display: inline" for="rbm_alts"><input type="checkbox" id="rbm_alts" name="rbm_alts" checked/> alternates</label>
<label style="display: inline" for="rbm_extra"><input type="checkbox" id="rbm_extra" name="rbm_extra" checked/> extra</label>
<input style="width:100%" type="text" placeholder="Filter" id="rbm_filter"/></div>
</div>
`
		for (const id of ["rbm_prints", "rbm_patterns", "rbm_molds", "rbm_alts", "rbm_extra"]) {
			document.getElementById(id).addEventListener('change', () => this.apply());
		}
		document.getElementById("rbm_filter").addEventListener('input', () => this.filter());

		this.render();
	}

	render() {
		const hasFilter = this.mergedCount !== this.filteredCount;
		document.getElementsByTagName('thead')[0].innerHTML = `
<th>Ref Part Num (${hasFilter ? `${this.filtered.length} of ` : ''}${this.merged.length})</th>
<th>Quantity (${hasFilter ? `${this.filteredCount} of ` : ''}${this.mergedCount})</th>
<th>Colors</th>
<th>Description</th>
`;

		let rows = "";
		for (let i = 0; i < this.filtered.length; i++) {
			const group = this.filtered[i];
			const row = this.renderRow(group);
			rows += row;
		}
		document.getElementsByTagName('tbody')[0].innerHTML = rows;
	}

	me = "RBmerge";
	colors = new Map();
	rels = new Map();
	relsEx = new Map([[Rel.Alt, []], [Rel.Mold, []], [Rel.Print, []], [Rel.Pattern, []]]);
	inventory = [];
	merged = [];
	mergedCount = 0;
	filtered = [];
	filteredCount = 0;
};

return new RBmerge();
})();

rbMerge.setup();
