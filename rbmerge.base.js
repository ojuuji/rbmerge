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
	SubPart  : 'B',
	Mold     : 'M',
	Print    : 'P',
	Pair     : 'R',
	Pattern  : 'T',
});

const Key = (partNum, rel) => `${partNum}:${rel}`;

class RBmerge {
	async init() {
		const partsData = "";   // <-- CAUTION! These four lines
		const relsData = "";    // <-- are replaced by the script
		const relsExData = "";  // <-- with actual base64-encoded
		const colorsData = "";  // <-- then gzipped tables data

		// <part_num>,<name>\n...
		const parts = (await decompress(partsData)).trim().split('\n');
		for (const part of parts) {
			let commaIdx = part.indexOf(',');
			let [partNum, name] = [part.slice(0, commaIdx), part.slice(commaIdx + 1)];
			this.names.set(partNum, name);
		}

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

		// <name>,<rgb>\n...
		const colors = (await decompress(colorsData)).trim().split('\n');
		for (const color of colors) {
			let commaIdx = color.indexOf(',');
			let [name, hex] = [color.slice(0, commaIdx), color.slice(commaIdx + 1)];
			this.colors.set(name, hex);
		}
	}

	setup() {
		if (this.parse()) {
			this.init().then(() => {
				this.apply();
				this.filter();
				this.render();
			});
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
			const part = {img: img, partNum: partNum, refPartNum: partNum, count: Number(count), color: color, name: name, sortFactor: 0};
			this.inventory.push(part);
		}

		return true;
	}

	resolve(part) {
		let found = new Set();
		let links = [[Rel.Print, 1000], [Rel.Pattern, 100], [Rel.Alt, 10], [Rel.Mold, 1]];
		while (true) {
			let resolved, resolvedSortFactor
			for (const [rel, sortFactor] of links) {
				resolved = this.rels.get(Key(part.refPartNum, rel));
				if (resolved === undefined) {
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

	hex2rgb(hex) {
		let r = parseInt(hex.slice(0, 2), 16);
		let g = parseInt(hex.slice(2, 4), 16);
		let b = parseInt(hex.slice(4, 6), 16);

		return [r, g, b]
	}

	rgb2hsv(r, g, b) {
		(r /= 255), (g /= 255), (b /= 255);
		let v = Math.max(r, g, b), c = v - Math.min(r, g, b);
		let h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c)); 

		return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
	}

	compareColors(l, r) {
		let hardcoded = ["[Unknown]", "[No Color/Any Color]", "White", "Black"];
		let lIdx = hardcoded.findIndex(e => e == l);
		let rIdx = hardcoded.findIndex(e => e == r);
		if (lIdx != -1 || rIdx != -1) {
			return lIdx != -1 && rIdx != -1 ? lIdx - rIdx : lIdx != -1 ? -1 : 1;
		}

		let lhex = this.colors.get(l);
		let rhex = this.colors.get(r);
		if (lhex === undefined || rhex === undefined) {
			return lhex === undefined && rhex === undefined ? 0 : lhex === undefined ? -1 : 1;
		}

		let [lr, lg, lb] = this.hex2rgb(lhex);
		let [rr, rg, rb] = this.hex2rgb(rhex);
		let ldiff = Math.max(Math.abs(lr - lg), Math.abs(lr - lb), Math.abs(lg - lb));
		let rdiff = Math.max(Math.abs(rr - rg), Math.abs(rr - rb), Math.abs(rg - rb));

		const grayThreshold = 18;
		if (ldiff <= grayThreshold || rdiff <= grayThreshold) {
			return ldiff <= grayThreshold && rdiff <= grayThreshold ? lr - rr : ldiff <= grayThreshold ? -1 : 1;
		}

		let [lh, ls, lv] = this.rgb2hsv(lr, lg, lb);
		let [rh, rs, rv] = this.rgb2hsv(rr, rg, rb);

		return lh != rh ? lh - rh : ls != rs ? ls - rs : lv - rv;
	}

	apply() {
		let map = new Map();

		for (const part of this.inventory) {
			let resolved = this.resolve(part);

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
		this.merged.sort((l, r) => {
			let lname = this.names.get(l[0].refPartNum);
			if (lname === undefined) {
				lname = l[0].name;
				console.log(`${this.me}: failed to get name for refPartNum=${l[0].refPartNum}, will use collected name "${lname}" for partNum=${l[0].partNum}`);
			}
			let rname = this.names.get(r[0].refPartNum);
			if (rname === undefined) {
				rname = r[0].name;
				console.log(`${this.me}: failed to get name for refPartNum=${r[0].refPartNum}, will use collected name "${rname}" for partNum=${r[0].partNum}`);
			}
			return lname.localeCompare(rname);
		});

		this.mergedCount = 0;
		for (let i = 0; i < this.merged.length; i++) {
			this.merged[i].sort((l, r) => {
				if (l.sortFactor != r.sortFactor) {
					return l.sortFactor - r.sortFactor;
				}
				if (l.partNum != r.partNum) {
					return l.partNum.localeCompare(r.partNum);
				}
				if (l.color != r.color) {
					return this.compareColors(l.color, r.color);
				}
				return 0;
			});

			this.merged[i].forEach(part => this.mergedCount += part.count);
		}
	}

	filter() {
		this.filtered = this.merged;
		this.filteredCount = this.mergedCount;
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
			desc = group[0].name;
		}
		else for (const [key, value] of countPerPartNum) {
			if (desc.length > 0) {
				desc += "<br>";
			}
			desc += `${value.count} [${key}] ${value.name}`;
		}

		return `<tr>\n<td><a href="https://rebrickable.com/parts/${group[0].refPartNum}/">${group[0].refPartNum}</a></td>\n<td>${total}</td>\n<td>\n${colors}\n</td>\n<td>${desc}</td>\n</tr>\n`;
	}

	render() {
		document.getElementsByTagName('thead')[0].innerHTML = `
<tr>
<th>Ref Part Num (${this.merged.length})</th>
<th>Quantity (${this.mergedCount})</th>
<th>Colors</th>
<th>Description</th>
</tr>
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
	names = new Map();
	colors = new Map();
	rels = new Map();
	relsEx = new Map([[Rel.Alt, []], [Rel.SubPart, []], [Rel.Mold, []], [Rel.Print, []], [Rel.Pair, []], [Rel.Pattern, []]]);
	inventory = [];
	merged = [];
	mergedCount = 0;
	filtered = [];
	filteredCount = 0;
};

return new RBmerge();
})();

rbMerge.setup();
