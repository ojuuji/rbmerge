(function() {
'use strict';

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
		catch {
			return false;
		}
	}

	const optionSpecs = [
		['merge_prints', true],
		['merge_patterns', true],
		['merge_molds', true],
		['merge_alternates', true],
		['merge_extra', true],
		['filter_color', ''],
		['filter_name', ''],
		['filter_smart', true],
		['filter_groups', false],
		['show_options', false],
	];
	let obj = {};
	for (const [propName, defaultValue] of optionSpecs) {
		Object.defineProperty(obj, propName, {
			get() {
				const value = isLocalStorageAvailable() ? localStorage.getItem(propName) : null;
				return value === null ? defaultValue : typeof defaultValue !== 'boolean' ? value : 0 != value;
			},
			set(value) {
				if (isLocalStorageAvailable()) {
					if (defaultValue === value) {
						localStorage.removeItem(propName);
					}
					else {
						localStorage.setItem(propName, typeof defaultValue !== 'boolean' ? value : value ? 1 : 0);
					}
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
	const relsExData = "";  // <-- by the script with actual gzipped
	const colorsData = "";  // <-- then base64-encoded tables data

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

function setup() {
	if (parse()) {
		resetTable();
		init().then(() => merge());
	}
}

let inventory_ = [];

function parse() {
	let table = "";
	if (document.getElementsByTagName('table').length === 1) {
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
						if (replaced !== part.refPartNum) {
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

function merge() {
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
		while (lw.length > 0 && rw.length > 0 && lw[lw.length - 1] === rw[rw.length - 1]) {
			lw.pop();
			rw.pop();
		}
		if (lw.length === 0 || rw.length === 0) {
			return lw.length !== 0 ? 1 : rw.length !== 0 ? -1 : 0;
		}
		const ln = parseInt(lw[lw.length - 1]);
		const rn = parseInt(rw[rw.length - 1]);
		if (!isNaN(ln) && !isNaN(rn)) {
			return ln - rn;
		}
		return lw[lw.length - 1].localeCompare(rw[rw.length - 1]);
	});

	filter();
}

function matchFilter(text, filter) {
	if (options_['filter_smart']) {
		const pattern = /^\d+$/.test(filter) ? new RegExp(`\\b${filter}\\b`) : filter;
		const newText = text.replace(pattern, '');
		return [newText.length !== text.length, newText];
	}
	else {
		const matched = text.includes(filter);
		return [matched, text];
	}
}

function filterFrom(isName, source, filter) {
	let filtered = [];
	let filteredCount = 0;

	if (options_['filter_groups']) {
		for (const group of source) {
			let groupFilter = [...filter];
			let lastText;
			grouploop: for (const part of group) {
				let text = isName ? part.nameLowerCase : part.colorLowerCase;
				// Still skip duplicate names (e.g. same parts with different colors)
				if (lastText !== text) {
					lastText = text;
					for (let i = groupFilter.length - 1; i >= 0; i --) {
						const [matched, newText] = matchFilter(text, groupFilter[i]);
						if (matched) {
							text = newText;
							groupFilter.splice(i, 1);
							if (groupFilter.length === 0) {
								break grouploop;
							}
						}
					}
				}
			}
			if (groupFilter.length === 0) {
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
					[matches, text] = matchFilter(text, filter[i]);
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

function filter() {
	const filterColor = options_['filter_color'].toLowerCase().match(/\S+/g) || [];
	const filterName = options_['filter_name'].toLowerCase().match(/\S+/g) || [];

	if (filterColor.size === 0 && filterName.size === 0) {
		filtered_ = merged_;
		filteredCount_ = mergedCount_;
	}
	else {
		let [filteredColor, filteredColorCount] = filterColor.size === 0 ? [merged_, mergedCount_] : filterFrom(false, merged_, filterColor);
		[filtered_, filteredCount_] = filterName.size === 0 ? [filteredColor, filteredColorCount] : filterFrom(true, filteredColor, filterName);
	}

	render();
}

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
			// colors += prevPartNum !== part.partNum ? "<hr>" : "<br>";
			colors += prevSortFactor !== part.sortFactor ? "<hr>" : "<br>";
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
	if (countPerPartNum.size === 1) {
		if (group[0].partNum === group[0].refPartNum) {
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

	return `<tr>\n<td>${partAnchor(group[0].refPartNum)}</td>\n<td>${total}</td>\n<td>\n${colors}\n</td>\n<td colspan="2">${desc}</td>\n</tr>\n`;
}

function resetTable() {
	document.getElementsByTagName('body')[0].innerHTML = `
<style>
#rbm_options {
	padding-top: 8px;
	padding-bottom: 8px;
	display: flex;
	flex-flow: row wrap;
}
fieldset {
	padding-left: 8px;
	padding-right: 8px;
}
fieldset#rbm_merge_options {
	display: flex;
	flex-flow: row wrap;
	flex-basis: 260px;
}
legend {
	margin-bottom: 0;
}
label {
	margin-right: 8px;
	font-weight: 400;
}
hr {
	border-top: 1px solid #DDD;
	margin: 0;
}
#rbm_num_ref_parts, #rbm_num_all_parts {
	width: 12ch;
}
th:has(> #rbm_filter_color) {
	width: 32ch;
}
th > input {
	border:0;
	width:100%;
}
th:has(> #rbm_toggle_options) {
	width: 32px
}
</style>
<div id="rbm_options">
<fieldset id="rbm_merge_options">
<legend>Merge</legend>
<label for="rbm_merge_prints"><input type="checkbox" id="rbm_merge_prints" name="rbm_merge_prints"/> prints</label>
<label for="rbm_merge_patterns"><input type="checkbox" id="rbm_merge_patterns" name="rbm_merge_patterns"/> patterns</label>
<label for="rbm_merge_molds"><input type="checkbox" id="rbm_merge_molds" name="rbm_merge_molds"/> molds</label>
<label for="rbm_merge_alternates"><input type="checkbox" id="rbm_merge_alternates" name="rbm_merge_alternates"/> alternates</label>
<label for="rbm_merge_extra"><input type="checkbox" id="rbm_merge_extra" name="rbm_merge_extra"/> extra</label>
</fieldset>
<fieldset id="rbm_filter_options">
<legend>Filter</legend>
<label for="rbm_filter_smart"><input type="checkbox" id="rbm_filter_smart" name="rbm_filter_smart"/> Use smart matching</label>
<label for="rbm_filter_groups"><input type="checkbox" id="rbm_filter_groups" name="rbm_filter_groups"/> Apply to groups instead of individual parts</label>
</fieldset>
</div>
<table class="table table-striped table-bordered">
<thead>
<tr>
<th id="rbm_num_ref_parts">0</th>
<th id="rbm_num_all_parts">0</th>
<th><input type="text" placeholder="Colors" id="rbm_filter_color"/></th>
<th><input type="text" placeholder="Description" id="rbm_filter_name"/></th>
<th><button title="Toggle Options" id="rbm_toggle_options"><svg xmlns="http://www.w3.org/2000/svg" fill="#444" width="24" height="24" viewBox="0 0 24 24"><style>@media(prefers-color-scheme:dark){path{fill:#BBB}}</style><path d="M24 13.616v-3.232c-1.651-.587-2.694-.752-3.219-2.019v-.001c-.527-1.271.1-2.134.847-3.707l-2.285-2.285c-1.561.742-2.433 1.375-3.707.847h-.001c-1.269-.526-1.435-1.576-2.019-3.219h-3.232c-.582 1.635-.749 2.692-2.019 3.219h-.001c-1.271.528-2.132-.098-3.707-.847l-2.285 2.285c.745 1.568 1.375 2.434.847 3.707-.527 1.271-1.584 1.438-3.219 2.02v3.232c1.632.58 2.692.749 3.219 2.019.53 1.282-.114 2.166-.847 3.707l2.285 2.286c1.562-.743 2.434-1.375 3.707-.847h.001c1.27.526 1.436 1.579 2.019 3.219h3.232c.582-1.636.75-2.69 2.027-3.222h.001c1.262-.524 2.12.101 3.698.851l2.285-2.286c-.744-1.563-1.375-2.433-.848-3.706.527-1.271 1.588-1.44 3.221-2.021zm-12 2.384c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z"/></svg></button></th>
</tr>
</thead>
<tbody>
</tbody>
</table
`;
	for (const name of ['prints', 'patterns', 'molds', 'alternates', 'extra']) {
		const el = document.getElementById('rbm_merge_' + name);
		el.addEventListener('change', ({target: element}) => {
			options_[element.id.replace('rbm_', '')] = element.checked;
			merge();
		});
		el.checked = options_['merge_' + name];
	}

	for (const name of ['color', 'name']) {
		const el = document.getElementById('rbm_filter_' + name);
		el.addEventListener('input', ({target: element}) => {
			options_[element.id.replace('rbm_', '')] = element.value;
			filter();
		});
		el.value = options_['filter_' + name];
	}

	for (const name of ['smart', 'groups']) {
		const el = document.getElementById('rbm_filter_' + name);
		el.addEventListener('change', ({target: element}) => {
			options_[element.id.replace('rbm_', '')] = element.checked;
			filter();
		});
		el.checked = options_['filter_' + name];
	}

	const updateOptionsPanel = () => {
		document.getElementById('rbm_options').style.display = options_['show_options'] ? 'flex' : 'none';
	};
	updateOptionsPanel();

	document.getElementById('rbm_toggle_options').addEventListener('click', () => {
		options_['show_options'] = !options_['show_options'];
		updateOptionsPanel();
	});
}

function render() {
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

	// Reapply lazy-load. RB uses jquery.lazyloadxt.extra.min.js
	$(window).lazyLoadXT?.();
}

setup();

})();
