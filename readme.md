# How to Build

RBmerge essentially is a standalone JavaScript file without external dependencies. It is already prepared for use. Below is description of how this preparation is done. If you need details about installation or the usage, read [docs/readme.md](docs/readme.md) instead.

RBmerge uses multiple CSV data tables from [Rebrickable Downloads](https://rebrickable.com/downloads/). Detailed description of the tables structure can be found in [data/readme.md](data/readme.md). Their local copies are stored in `data` subdirectory. To fetch the latest versions of the tables run `data/fetch.sh`. In repository this is done daily using GitHub Workflows.

Origin file `rbmerge.base.js` contains only placeholders for these tables. Run `build/build.sh` to extract actual data from the tables and embed it in the script. It saves resulting file as `build/rbmerge.js`. GitHub Workflow is configured to regenerate this file on modification of the origin file `rbmerge.base.js` or any of `data/*.csv` tables.

Every modification of `build/rbmerge.js` triggers GitHub Workflow which minifies this script and stores result as `docs/js/rbmerge.min.js`. This is final version of the script, which is referenced in [installation guide](docs/readme.md#installation).

Modification of files within `docs` directory triggers GitHub Workflow which deploys Jekyll site 
https://ojuuji.github.io/rbmerge/.
