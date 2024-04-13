
All CSV files except `part_relationships_ex.csv` are downloaded from [https://rebrickable.com/downloads/](https://rebrickable.com/downloads/).

# colors.csv

This file contains table with the following three columns:
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

Newer mold not necessarily comes first. For example, here the newer one is [3007](https://rebrickable.com/parts/3007/):

```
M,3007b,3007
```

Rebrickable uses this relation in the build matching option _"Ignore mold variations in parts."_

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

As in `part_relationships.csv` it contains three columns with the same relation type column:
```
rel_type,child_part_num_regex,parent_part_num_repl
```
However as a second column here can be used not only a part number but also a regular expression. This allows to apply relationship to multiple part numbers with a single row.

To apply relationship, regex must match an entire part number. Wrapping with `^` and `$` is not required.

Third column is a replacement which can be either a part number or a string containing back references. For the first capture group it will be `$1` and so on.

For example:

```
P,(.+)pr\d+[a-z]*,$1
```

Part [35074pr0003](https://rebrickable.com/parts/35074pr0003/) will be resolved as a print of `35074`, which does not really exist (and thus is not available on Rebrickable), but in context of the parts merging this is fine.
