# latin-squares
Latin Squares visualizations. To see it in action, visit at http://mrhen.github.io/latin-squares.

## Technical Overview

* [D3](https://d3js.org/) for the visualizations
* [TypeScript](http://www.typescriptlang.org/) (but mostly because I wanted to see how hard it was to prototype in JS and then port to TypeScript)
* [gulp](http://gulpjs.com/) build pipeline similar to what was used on [obtuse-octo-adventure](https://github.com/MrHen/obtuse-octo-adventure)
* Deployed at http://mrhen.github.io/latin-squares
  * Deploy using `gulp deploy` from root directory
  * Builds the entire app and publishes the files to GitHub Pages
* Node ready -- added for the sake of local testing
* No external front-end libraries but it was tempting to use Angular to handle the dependency loading
* Code is organized by visualization (Cell, Hive, Constraint). It could also be organized by each conceptual layer (Builder, Draw, Update).
* Includes a [Dancing Links](https://en.wikipedia.org/wiki/Dancing_Links) implementation (special thanks to [@taeric](https://github.com/taeric) for their [Dancing Links](http://taeric.github.io/DancingLinks.html) example)

## Next steps

* Sudoku variant
* Visualizations for DLX specifically
* gists for each visualization on their own
* Publish the dlx module to make it easier to spread around similar projects
