var rbMerge = {};
(function() {
"use strict";

async function decompress(base64string) {
	const bytes = Uint8Array.from(atob(base64string), c => c.charCodeAt(0));
	const cs = new DecompressionStream('gzip');
	const writer = cs.writable.getWriter();
	writer.write(bytes);
	writer.close();
	return new Response(cs.readable).arrayBuffer().then(function (arrayBuffer) {
		return new TextDecoder().decode(arrayBuffer);
	});
}

const options_ = (function() {
	function isLocalStorageAvailable() {
		try {
			const test = '__test__';
			localStorage.setItem(test, test);
			localStorage.removeItem(test);
			return true;
		}
		catch (e) {
			return false;
		}
	}

	let obj = {};
	for (const [propName, defaultValue] of [['merge_prints', 1], ['merge_patterns', 1], ['merge_molds', 1], ['merge_alternates', 1], ['merge_extra', 1]]) {
		Object.defineProperty(obj, propName, {
			get() {
				return 0 != (isLocalStorageAvailable() ? (localStorage.getItem(propName) || defaultValue) : defaultValue);
			},
			set(value) {
				if (isLocalStorageAvailable()) {
					localStorage.setItem(propName, value ? 1 : 0);
				}
			}
		});
	}
	return Object.freeze(obj);
})();

function key(partNum, rel) {
	return `${partNum}:${rel}`;
}

const ME = "RBmerge";

const REL_ALT     = 'A';
const REL_MOLD    = 'M';
const REL_PRINT   = 'P';
const REL_PATTERN = 'T';

let colors_ = new Map();
let rels_ = new Map();
let relsEx_ = new Map([[REL_ALT, []], [REL_MOLD, []], [REL_PRINT, []], [REL_PATTERN, []]]);

async function init() {
	const relsData = "";    // <-- CAUTION! These lines are replaced
	const relsExData = "";  // <-- by the script with actual base64-
	const colorsData = "";  // <-- encoded then gzipped tables data

	// <rel_type>,<child_part_num>,<parent_part_num>\n...
	const relSpecs = (await decompress(relsData)).trim().split('\n');
	for (const spec of relSpecs) {
		let [type, child, parent] = spec.split(',')
		rels_.set(key(child, type), parent);
	}

	// <rel_type>,<child_part_num_regex>,<parent_part_num>\n...
	const relExSpecs = (await decompress(relsExData)).trim().split('\n');
	for (const spec of relExSpecs) {
		let [type, child, parent] = spec.split(',')
		relsEx_.get(type).push({regex: new RegExp(`^${child}$`), partNum: parent});
	}

	// already sorted colors in form <name>\n...
	colors_ = (await decompress(colorsData)).trim().split('\n');
}

rbMerge.setup = () => {
	if (parse()) {
		resetTable();
		init().then(() => rbMerge.merge());
	}
};

let inventory_ = [];

function parse() {
	let table = "";
	if (document.getElementsByTagName('table').length == 1) {
		table = document.getElementsByTagName('table')[0].innerHTML;
	}
	const thead = "<tr>\n<th>Image</th>\n<th>Part Num</th>\n<th>Quantity</th>\n<th>Color</th>\n<th>Description</th>\n</tr>\n";
	if (!table.includes(thead)) {
		document.getElementsByTagName('body')[0].innerHTML = `<h1 style='background-color: red; color: white'>${ME}: document does not contain table in expected format`;
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
			colorLowerCase: color.toLowerCase(),
			name: name,
			nameLowerCase: name.toLowerCase(),
			sortFactor: 0,
		};
		inventory_.push(part);
	}

	return true;
}

function resolve(part) {
	let found = new Set();
	let links = [
		[REL_PRINT, 1000, document.getElementById('rbm_merge_prints').checked],
		[REL_PATTERN, 100, document.getElementById('rbm_merge_patterns').checked],
		[REL_MOLD, 1, document.getElementById('rbm_merge_molds').checked],
		[REL_ALT, 10, document.getElementById('rbm_merge_alternates').checked],
	];
	let resolveExtra = document.getElementById('rbm_merge_extra').checked;
	while (true) {
		let resolved, resolvedSortFactor;
		for (const [rel, sortFactor, shouldResolve] of links) {
			if (shouldResolve) {
				resolved = rels_.get(key(part.refPartNum, rel));
				if (resolved === undefined && resolveExtra) {
					for (const {regex, partNum} of relsEx_.get(rel)) {
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
			console.log(`${ME}: avoided circular reference involving parts ${part.refPartNum} and ${resolved}`);
			return part;
		}
		found.add(resolved);
		part.refPartNum = resolved;
		part.sortFactor += resolvedSortFactor;
	}
}

function compareColors(l, r) {
	if (l !== r) {
		for (const color of colors_) {
			if (color === l || color === r) {
				return color === l ? -1 : 1;
			}
		}
	}
	return 0;
}

let merged_ = [];
let mergedCount_ = 0;

rbMerge.merge = () => {
	let map = new Map();

	for (const part of inventory_) {
		let resolved = resolve(structuredClone(part));

		let list = map.get(resolved.refPartNum);
		if (list === undefined) {
			map.set(resolved.refPartNum, [resolved]);
		}
		else {
			list.push(resolved);
		}
	}

	merged_ = [...map.values()];
	mergedCount_ = 0;

	for (const group of merged_) {
		group.sort((l, r) => l.sortFactor - r.sortFactor || l.partNum.localeCompare(r.partNum) || compareColors(l.color, r.color));
		group.forEach(part => mergedCount_ += part.count);
	}

	merged_.sort((l, r) => {
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

	rbMerge.filter(true);
};

let filterGroups_ = false;
let filterReuse_ = false;

function filterFrom(isName, source, filter) {
	let filtered = [];
	let filteredCount = 0;

	if (filterGroups_) {
		for (const group of source) {
			let groupFilter = [...filter];
			let lastText;
			grouploop: for (const part of group) {
				let text = isName ? part.nameLowerCase : part.colorLowerCase;
				if (lastText !== text) {
					lastText = text;
					for (let i = groupFilter.length - 1; i >= 0; i --) {
						if (text.includes(groupFilter[i])) {
							if (!filterReuse_) {
								text = text.replace(groupFilter[i], '');
							}
							groupFilter.splice(i, 1);
							if (groupFilter.length == 0) {
								break grouploop;
							}
						}
					}
				}
			}
			if (groupFilter.length == 0) {
				filtered.push(group);
				group.forEach(part => filteredCount += part.count);
			}
		}
	}
	else {
		for (const group of source) {
			let filteredGroup = [];
			for (const part of group) {
				let matches = true;
				let text = isName ? part.nameLowerCase : part.colorLowerCase;
				for (let i = 0; i < filter.length && matches; i++) {
					matches = -1 !== text.indexOf(filter[i]);
					if (matches && !filterReuse_) {
						text = text.replace(filter[i], '');
					}
				}
				if (matches) {
					filteredGroup.push(part);
					filteredCount += part.count
				}
			}
			if (filteredGroup.length !== 0) {
				filtered.push(filteredGroup);
			}
		}
	}

	return [filtered, filteredCount];
}

let filtered_ = [];
let filteredCount_ = 0;
let lastFilterColor_;
let lastFilterName_;

rbMerge.filter = (force = false) => {
	const filterColor = document.getElementById("rbm_filter_color").value.toLowerCase().match(/\S+/g) || [];
	const filterName = document.getElementById("rbm_filter_name").value.toLowerCase().match(/\S+/g) || [];
	if (!force && lastFilterName_ !== undefined && filterName.join(' ') === lastFilterName_.join(' ')
			&& lastFilterColor_ !== undefined && filterColor.join(' ') === lastFilterColor_.join(' ')) {
		return;
	}
	lastFilterColor_ = filterColor;
	lastFilterName_ = filterName;

	if (filterColor.size === 0 && filterName.size === 0) {
		filtered_ = merged_;
		filteredCount_ = mergedCount_;
	}
	else {
		let [filteredColor, filteredColorCount] = filterColor.size === 0 ? [merged_, mergedCount_] : filterFrom(false, merged_, filterColor);
		[filtered_, filteredCount_] = filterName.size === 0 ? [filteredColor, filteredColorCount] : filterFrom(true, filteredColor, filterName);
	}

	rbMerge.render();
};

function partAnchor(partNum) {
	return `<a href="https://rebrickable.com/parts/${partNum}/" target="_blank">${partNum}</a>`;
}

function renderRow(group) {
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
			desc = `[${partAnchor(group[0].partNum)}] ${group[0].name}`;
		}
	}
	else for (const [partNum, value] of countPerPartNum) {
		if (desc.length > 0) {
			desc += "<br>";
		}
		desc += `${value.count} [${partAnchor(partNum)}] ${value.name}`;
	}

	return `<tr>\n<td>${partAnchor(group[0].refPartNum)}</td>\n<td>${total}</td>\n<td>\n${colors}\n</td>\n<td>${desc}</td>\n</tr>\n`;
}

function resetTable() {
	document.getElementsByTagName('body')[0].innerHTML = '<div id="rbm_options"></div>' + document.getElementsByTagName('table')[0].outerHTML;
	document.getElementsByTagName('thead')[0].innerHTML = `
<th style="width: 7em; white-space: nowrap">@:<span id="rbm_num_ref_parts">0</span></th>
<th style="width: 7em; white-space: nowrap">#:<span id="rbm_num_all_parts">0</span></th>
<th style="width: 18em"><input style="width:100%" type="text" placeholder="Colors" id="rbm_filter_color"/></th>
<th><input style="width:100%" type="text" placeholder="Description" id="rbm_filter_name"/></th>
`;
	document.getElementsByTagName('tbody')[0].innerHTML = "Loading ...";

	let optionsHtml = '';
	for (const name of ['prints', 'patterns', 'molds', 'alternates', 'extra']) {
		optionsHtml += `\n<label style="display: inline" for="rbm_merge_${name}"><input type="checkbox" id="rbm_merge_${name}" name="rbm_merge_${name}" ${options_['merge_' + name] ? 'checked' : ''}/> ${name}</label>`;
	}
	document.getElementById('rbm_options').innerHTML = `
<div style="padding: 9px">
<label style="display: inline">Merge: </label>
${optionsHtml}
</div>
</div>
`;
	for (const name of ['prints', 'patterns', 'molds', 'alternates', 'extra']) {
		document.getElementById('rbm_merge_' + name).addEventListener('change', ({target: element}) => {
			options_[element.id.replace('rbm_', '')] = element.checked;
			rbMerge.merge();
		});
	}

	document.getElementById("rbm_filter_color").addEventListener('input', rbMerge.filter);
	document.getElementById("rbm_filter_name").addEventListener('input', rbMerge.filter);
}

rbMerge.render = () => {
	const hasFilter = mergedCount_ !== filteredCount_;
	document.getElementById("rbm_num_ref_parts").innerHTML = `${hasFilter ? `${filtered_.length}/` : ''}${merged_.length}`;
	document.getElementById("rbm_num_all_parts").innerHTML = `${hasFilter ? `${filteredCount_}/` : ''}${mergedCount_}`;

	let rows = "";
	for (let i = 0; i < filtered_.length; i++) {
		const group = filtered_[i];
		const row = renderRow(group);
		rows += row;
	}
	document.getElementsByTagName('tbody')[0].innerHTML = rows;
};
})();

rbMerge.setup();
