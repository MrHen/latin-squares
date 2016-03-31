// Adapted from http://taeric.github.io/DancingLinks.html
namespace dlx {
    export interface DlxLink<T> {
        name: string;
        size?: number;
        col?: DlxLink<T>;
        node?: T;

        down: DlxLink<T>;
        up: DlxLink<T>;
        left: DlxLink<T>;
        right: DlxLink<T>;
    }

    export interface DlxTree<T> {
        parent: DlxTree<T>;
        children: DlxTree<T>[];
        depth: number;
        node: T;
        success?: boolean;
    }

    export interface DlxSolution<T> {
        nodes: T[];
        success: boolean;
    }

    export interface DlxConstraint<T> {
        node: T;
        skip: boolean;
        value: boolean;
    }

    export interface DlxMatrix<T> {
        [outer: string]: {
            [inner: string]: DlxConstraint<T>
        };
    }

    export class Dlx<T> {
      private dlx_headers: DlxLink<T>;
      private dlx_solutions: DlxSolution<T>[] = [];
      private dlx_O: T[] = [];
      private dlx_current: DlxTree<T> = {
          parent: null,
          children: [],
          depth: 0,
          node: null
      };

      private constraintMatrix: DlxMatrix<T>;
      private showSteps: boolean;

      constructor(constraintMatrix: DlxMatrix<T>, dlx_showSteps: boolean = false) {
        this.constraintMatrix = constraintMatrix;
        this.showSteps = dlx_showSteps;
      }

      public solve = () => {
        this.dlx_initializeHeaders();
        this.dlx_search(0);

        return {
            tree: this.dlx_current,
            solutions: this.dlx_solutions
        };
      };

      private dlx_search(k: number) {
          let c: DlxLink<T>, r: DlxLink<T>;
          if (this.showSteps || this.dlx_headers.right === this.dlx_headers) {
              let solution = {
                  nodes: _.clone(this.dlx_O),
                  success: this.dlx_headers.right === this.dlx_headers
              };

              this.dlx_current.success = this.dlx_headers.right === this.dlx_headers;
              this.dlx_solutions.push(solution);
              if (this.dlx_headers.right === this.dlx_headers) {
                  return;
              }
          }
          c = this.dlx_smallestColumn();
          this.dlx_cover(c);
          r = c.down;
          while (r !== c) {
              this.dlx_current = {
                  parent: this.dlx_current,
                  children: [],
                  depth: k,
                  node: r.node
              };
              this.dlx_current.parent.children.push(this.dlx_current);

              this.dlx_O.push(r.node);
              r = r.right;
              while (r.col !== c) {
                  this.dlx_cover(r.col);
                  r = r.right;
              }
              this.dlx_search(k + 1);
              r = r.left;
              while (r.col !== c) {
                  this.dlx_uncover(r.col);
                  r = r.left;
              }
              r = r.down;
              this.dlx_O.pop();
              this.dlx_current = this.dlx_current.parent;
          }
          this.dlx_uncover(c);
      }

      private dlx_cover(c: DlxLink<T>) {
          let r = c.down;
          c.right.left = c.left;
          c.left.right = c.right;
          while (r !== c) {
              r = r.right;
              while (r.col !== c) {
                  r.up.down = r.down;
                  r.down.up = r.up;
                  r.col.size--;
                  r = r.right;
              }
              r = r.down;
          }
      }

      private dlx_uncover(c: DlxLink<T>) {
          let r = c.up;
          c.right.left = c;
          c.left.right = c;
          while (r !== c) {
              r = r.left;
              while (r.col !== c) {
                  r.up.down = r;
                  r.down.up = r;
                  r.col.size++;
                  r = r.left;
              }
              r = r.up;
          }
      }

      private dlx_smallestColumn(): DlxLink<T> {
          let h: DlxLink<T>, c: DlxLink<T>, s = Number.MAX_VALUE;
          h = this.dlx_headers.right;
          while (h !== this.dlx_headers) {
              if (h.size < s) {
                  c = h;
                  s = c.size;
              }
              h = h.right;
          }
          return c;
      }

      private dlx_initializeHeaders() {
          let i: string, j: string;

          let rowTrackers: { [index: string]: DlxLink<T> } = {};

          this.dlx_headers = {
              name: "root",
              right: null,
              left: null,
              up: null,
              down: null
          };
          this.dlx_headers.right = this.dlx_headers;
          this.dlx_headers.left = this.dlx_headers;

          for (i in this.constraintMatrix) {
              let curCol: DlxLink<T> = {
                  name: i,
                  right: this.dlx_headers,
                  left: this.dlx_headers.left,
                  size: 0,
                  down: null,
                  up: null,
              };

              this.dlx_headers.left.right = curCol;
              this.dlx_headers.left = curCol;
              curCol.up = curCol;
              curCol.down = curCol;

              for (j in this.constraintMatrix[i]) {
                  let constraint = this.constraintMatrix[i][j];
                  let value = constraint.value;
                  if (!value || constraint.skip) {
                      continue;
                  }
                  let curRow: DlxLink<T> = {
                      name: j,
                      node: constraint.node,
                      right: null,
                      left: null,
                      down: curCol,
                      up: curCol.up,
                      col: curCol
                  };
                  curCol.size++;
                  curCol.up.down = curRow;
                  curCol.up = curRow;

                  let prevRow = rowTrackers[j];
                  if (!prevRow) {
                      curRow.right = curRow;
                      curRow.left = curRow;

                      rowTrackers[j] = curRow;
                  } else {
                      curRow.right = prevRow;
                      curRow.left = prevRow.left;
                      prevRow.left.right = curRow;
                      prevRow.left = curRow;
                  }
              }
          }
      }
    }
}
