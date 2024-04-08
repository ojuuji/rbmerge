# How to Build

Script is already prepared for use. Read [/docs/readme.md](/docs/readme.md) for details about installation and the usage.

It uses multiple CSV data tables from [Rebrickable Downloads](https://rebrickable.com/downloads/). Detailed description of the tables structure can be found in [/data/readme.md](/data/readme.md). Their local copies are stored in `/data` subdirectory. To fetch the latest versions run `/data/fetch.sh`.

These tables are embedded in the script. Origin file `/rbmerge.base.js` contains only placeholders for them. Actual data is embedded by `/build/build.sh` script which saves resulting file as `/build/rbmerge.js`.
