Initial preparation:
```
git clone --recurse-submodules https://github.com/ojuuji/rbmerge.git
cd rbmerge/sqlite
make && make indices
```
To generate userscript run the following command in the repository root directory:
```
./script/build.sh
```
Script will be generated as `./www/js/rbmerge.js`.

To build and run locally an app, install Node.js and then run next commands:
```
cd app
npm ci
npm start
```

These steps are automated via GitHub Actions, so you may check [workflows](.github/workflows) directory for details.

Documentation can be found on GitHub Pages: https://ojuuji.github.io/rbmerge/
