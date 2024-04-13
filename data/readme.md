
- [colors.csv](#colorscsv)
- [parts.csv](#partscsv)
- [part_relationships.csv](#part_relationshipscsv)
  - [`A` - Alternate](#a---alternate)
  - [`B` - Sub-Part](#b---sub-part)
  - [`M` - Mold](#m---mold)
  - [`P` - Print](#p---print)
  - [`R` - Pair](#r---pair)
  - [`T` - Pattern](#t---pattern)
- [part_relationships_ex.csv](#part_relationships_excsv)

All CSV files except `part_relationships_ex.csv` are downloaded from [https://rebrickable.com/downloads/](https://rebrickable.com/downloads/).

# colors.csv

This file contains table with the following four columns:

```
id,name,rgb,is_trans
```

`id` is a number, unique for each color. In other tables colors are referenced by this number.

`name` is the color name on Rebrickable.

`rgb` is RGB color in a form of [HEX triplet](https://en.wikipedia.org/wiki/Web_colors#Hex_triplet), 6 digits, no prefix.

`is_trans` is a flag indicating if color is transparent. Possible values are `t` (for transparent colors) and `f`.

Examples:

```
236,Trans-Light Purple,96709F,t
272,Dark Blue,0A3463,f
```

# parts.csv

This file contains table with the following four columns:

```
part_num,name,part_cat_id,part_material
```

`name` is the part name on Rebrickable.

`part_cat_id` external reference (foreign key) to `id` in `part_categories.csv`.

`part_material` is the material from which the part is made. Possible options:

```
Cardboard/Paper
Cloth
Flexible Plastic
Foam
Metal
Plastic
Rubber
```

# part_relationships.csv

This file contains table with the following three columns:

```
rel_type,child_part_num,parent_part_num
```

Relation type is one of `ABMPRT`. They all are described below.

## `A` - Alternate

```
A,11954,62531
```

For [11954](https://rebrickable.com/parts/11954/) Rebrickable will say it is usable as alternate for the [62531](https://rebrickable.com/parts/62531/). And vice versa.

Rebrickable uses this relation in the build matching option _"Consider alternate parts that can usually be used as replacements, but are not always functionally compatible."_

There will be no corresponding row `A,62531,11954` so this relation should be considered bidirectional.

## `B` - Sub-Part

```
B,6051,6051c04
```

[6051](https://rebrickable.com/parts/6051/) is a sub-part of [6051c04](https://rebrickable.com/parts/6051c04/).

## `M` - Mold

```
M,92950,3455
```

[92950](https://rebrickable.com/parts/92950/) and [3455](https://rebrickable.com/parts/3455/) are essentially the same parts where 92950 is a newer mold. For 3455 Rebrickable says it is superseded by 92950.

Rebrickable uses this relation in the build matching option _"Ignore mold variations in parts."_

The successor part is not necessarily listed as `child_part_num`. And an older part is not necessarily listed as `parent_part_num`. Here are two examples in the form `child_part_num (year_from, year_to) -> parent_part_num (year_from, year_to)`:

```
60608 (2007, <present>) -> 3854 (1978, 2008)
3002a (1954, 1990) -> 3002 (1979, <present>)
```

In case of multiple molds not all combinations are listed. For example, for parts [67695](https://rebrickable.com/parts/67695/), [93571](https://rebrickable.com/parts/93571/), [32174](https://rebrickable.com/parts/32174/) there are two rows:

```
M,93571,32174
M,67695,32174
```

But there are no row `M,93571,67695`. For the info, `67695` is the latest mold.

Moreover, alternative not necessarily points to the latest mold, and it may have molds too:

```
A,60176,32174
M,89652,60176
```

## `P` - Print

```
P,4740pr0014,4740
```

[4740pr0014](https://rebrickable.com/parts/4740pr0014/) is a print of [4740](https://rebrickable.com/parts/4740/).

Rebrickable uses this relation along with relation `T` in the build matching option _"Ignore printed and patterned part differences."_

## `R` - Pair

```
R,18947,35188
```

[18947](https://rebrickable.com/parts/18947/) pairs with [35188](https://rebrickable.com/parts/35188/). And vice versa.

There will be no corresponding row `R,35188,18947` so this relation should be considered bidirectional.

## `T` - Pattern

```
T,19858pat0002,19858
```

[19858pat0002](https://rebrickable.com/parts/19858pat0002/) is a pattern of [19858](https://rebrickable.com/parts/19858/).

Rebrickable uses this relation along with relation `P` in the build matching option _"Ignore printed and patterned part differences."_

# part_relationships_ex.csv

This table defines extra relationships, not available on Rebrickable and maintained within RBmerge.

As in `part_relationships.csv` it contains three columns:

```
rel_type,child_part_num_regex,parent_part_num_repl
```

This is where the similarities end. This file allows comments, staring with `#`, and blank lines. Any other line is expected to have relation i.e. there is no table header. So this is not really a CSV table.

First column represents relation type and has the same meaning as in `part_relationships.csv`. As a second column here can be used not only a part number but also a regular expression. This allows to apply relationship to multiple part numbers using a single row.

Relationship is applied only if regex matches an entire part number. Wrapping with `^` and `$` is not necessary and is always implied.

Third column is a replacement, which can be either a part number or a string containing back references. For the first capture group back reference will be `$1` and so on.

For example:

```
P,(.+)pr\d+[a-z]*,$1
```

Part [35074pr0003](https://rebrickable.com/parts/35074pr0003/) will be resolved as a print of `35074`, which does not really exist (and thus is not available on Rebrickable), but in context of the parts merging this is fine.
