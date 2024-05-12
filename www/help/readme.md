# Help

- [Table Structure](#table-structure)
  - [Header](#header)
  - [Column #1: Reference Part Number](#column-1-reference-part-number)
  - [Column #2: Number of Parts](#column-2-number-of-parts)
  - [Column #3: Colors](#column-3-colors)
  - [Column #4: Description](#column-4-description)
- [Merging Parts](#merging-parts)
- [Filtering Parts](#filtering-parts)

## Table Structure

Each row contains single and unique reference part number and group of actual parts from the inventory, which resolve to this reference part.

All part numbers everywhere in the table are hyperlinks to corresponding parts on Rebrickable.

### Header

Table consists of four columns:

1. **Reference Part Number**. As header is used total number of the reference parts (total number of rows) in the table.
2. **Number of Parts**. As header is used total number of parts at all.
3. **`Colors`**. Header is an edit box which acts as a filter for the color names.
4. **`Description`**. Header is an edit box which acts as a filter for the part names.

Example:
![Example of the table header](../images/table_header.png)

If everything went well, then the number of parts should actually be equal to the one on Rebrickable page `All My Parts`:

![Parts count on Rebrickable](../images/parts_count_on_rb.png)

### Column #1: Reference Part Number

Each row contains single and unique reference part number. They are unique because colors are always merged regardless of the merge options.

Process of resolving to the reference part does not depend on the inventory, so the reference part may not even exist in the inventory. In fact, it may not even exist at all.

### Column #2: Number of Parts

### Column #3: Colors

Each row contains images and color names for all parts in the group. 

### Column #4: Description

## Merging Parts

When processing parts list, every part is resolved to so-called _reference_ part. Then all parts with the same reference part are merged together.

Part is resolved to the reference part if it meets any of these criteria:
- it has different color but the same part number as the reference part
- (depending on the merge options) it is print, pattern, mold, or alternate of the reference part

Which one becomes the reference part in case of molds and alternates is decided basing on the part usage in the sets and the years when it was used. Basically it will be either a part with the most recent year or, if there are multiple parts with the same year, the one that is referenced in more sets.

## Filtering Parts

Rows in the table can be filtered by color names and by part names.
