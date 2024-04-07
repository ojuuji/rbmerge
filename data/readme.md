
All CSV files except `part_relationships_ex.csv` are downloaded from [https://rebrickable.com/downloads/](https://rebrickable.com/downloads/).

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

For [11954](https://rebrickable.com/parts/11954) RB will say it is usable as alternate for the [62531](https://rebrickable.com/parts/62531). And vice versa.

RB uses this relation in the build matching option _"Consider alternate parts that can usually be used as replacements, but are not always functionally compatible."_

There will be no corresponding row `A,62531,11954` so this relation should be considered bidirectional.

## `B` - Sub-Part

```
B,6051,6051c04
```

[6051](https://rebrickable.com/parts/6051) is a sub-part of [6051c04](https://rebrickable.com/parts/6051c04).

## `M` - Mold

```
M,92950,3455
```

[92950](https://rebrickable.com/parts/92950) and [3455](https://rebrickable.com/parts/3455) are essentially the same parts where 92950 is a newer mold. For 3455 RB says it is superseded by 92950.

RB uses this relation in the build matching option _"Ignore mold variations in parts."_

## `P` - Print

```
P,4740pr0014,4740
```

[4740pr0014](https://rebrickable.com/parts/4740pr0014) is a print of [4740](https://rebrickable.com/parts/4740).

RB uses this relation along with relation `T` in the build matching option _"Ignore printed and patterned part differences."_

## `R` - Pair

```
R,18947,35188
```

[18947](https://rebrickable.com/parts/18947) pairs with [35188](https://rebrickable.com/parts/35188). And vice versa.

There will be no corresponding row `R,35188,18947` so this relation should be considered bidirectional.

## `T` - Pattern

```
T,19858pat0002,19858
```

[19858pat0002](https://rebrickable.com/parts/19858pat0002) is a pattern of [19858](https://rebrickable.com/parts/19858).

RB uses this relation along with relation `P` in the build matching option _"Ignore printed and patterned part differences."_
