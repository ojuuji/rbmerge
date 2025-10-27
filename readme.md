# RBmerge

Documentation is best read on GitHub Pages: [ojuuji.github.io/rbmerge/](https://ojuuji.github.io/rbmerge/)

## How to Build

To generate userscript run the following command in the repository root directory:

```sh
./script/build.sh
```

Script will be generated as `./www/js/rbmerge.js`.

To build and run locally an app, install Node.js and then run next commands:

```sh
cd app
npm ci
npm start
```

To run the site locally:

```bash
./script/build.sh
cd app
npm run build
cd ../www
bundle install
bundle exec jekyll serve
```

These steps are automated via GitHub Actions, so you may check [workflows](.github/workflows) directory for details.
