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
      private headers: DlxLink<T>;
      private solutions: DlxSolution<T>[] = [];
      private currentSolution: T[] = [];
      private currentTree: DlxTree<T> = {
          parent: null,
          children: [],
          depth: 0,
          node: null
      };

      private constraintMatrix: DlxMatrix<T>;
      private showSteps: boolean;

      constructor(constraintMatrix: DlxMatrix<T>, showSteps: boolean = false) {
        this.constraintMatrix = constraintMatrix;
        this.showSteps = showSteps;
      }

      public solve = () => {
        this.initializeHeaders();
        this.search(0);

        return {
            tree: this.currentTree,
            solutions: this.solutions
        };
      };

      private search(k: number) {
          let c: DlxLink<T>, r: DlxLink<T>;
          if (this.showSteps || this.headers.right === this.headers) {
              let solution = {
                  nodes: _.clone(this.currentSolution),
                  success: this.headers.right === this.headers
              };

              this.currentTree.success = this.headers.right === this.headers;
              this.solutions.push(solution);
              if (this.headers.right === this.headers) {
                  return;
              }
          }
          c = this.smallestColumn();
          this.cover(c);
          r = c.down;
          while (r !== c) {
              this.currentTree = {
                  parent: this.currentTree,
                  children: [],
                  depth: k,
                  node: r.node
              };
              this.currentTree.parent.children.push(this.currentTree);

              this.currentSolution.push(r.node);
              r = r.right;
              while (r.col !== c) {
                  this.cover(r.col);
                  r = r.right;
              }
              this.search(k + 1);
              r = r.left;
              while (r.col !== c) {
                  this.uncover(r.col);
                  r = r.left;
              }
              r = r.down;
              this.currentSolution.pop();
              this.currentTree = this.currentTree.parent;
          }
          this.uncover(c);
      }

      private cover(c: DlxLink<T>) {
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

      private uncover(c: DlxLink<T>) {
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

      private smallestColumn(): DlxLink<T> {
          let h: DlxLink<T>, c: DlxLink<T>, s = Number.MAX_VALUE;
          h = this.headers.right;
          while (h !== this.headers) {
              if (h.size < s) {
                  c = h;
                  s = c.size;
              }
              h = h.right;
          }
          return c;
      }

      private initializeHeaders() {
          let i: string, j: string;

          let rowTrackers: { [index: string]: DlxLink<T> } = {};

          this.headers = {
              name: "root",
              right: null,
              left: null,
              up: null,
              down: null
          };
          this.headers.right = this.headers;
          this.headers.left = this.headers;

          for (i in this.constraintMatrix) {
              let curCol: DlxLink<T> = {
                  name: i,
                  right: this.headers,
                  left: this.headers.left,
                  size: 0,
                  down: null,
                  up: null,
              };

              this.headers.left.right = curCol;
              this.headers.left = curCol;
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
