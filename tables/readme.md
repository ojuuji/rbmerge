[rb.db](https://ojuuji.github.io/rb.db/) is used to generate necessary parts info.

Separately from it here is maintained `part_relationships_ex.csv` which defines extra relationships.

Empty lines and lines starting with `#` character are ignored (the latter is used for comments). So this is not really a CSV table, but the same file extension is kept to simplify maintenance.

Each data line there describes relationship similar to `part_relationships.csv` but uses extended format:

```
<rel_type><sep><child_part_num_regex><sep><parent_part_num_repl>
```
where `<sep>` is any character not appearing elsewhere on the line.

`<rel_type>` represents relation type the same way as in `part_relationships.csv`.

In `<child_part_num_regex>` can be used not only a part number but also a regular expression. This allows to apply relationship to multiple part numbers using a single spec.

Relationship is applied only if regex matches an entire part number. Wrapping with `^` and `$` is not necessary and is always implied.

`<parent_part_num_repl>` is a replacement, which can be either a part number or a string containing back references. For the first capture group back reference will be `$1` and so on.

For example, with the following spec part [35074pr0003](https://rebrickable.com/parts/35074pr0003/) will be resolved as a print of part `35074`:

```
P,(.+)pr\d+,$1
```
