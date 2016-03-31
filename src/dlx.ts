// Adapted from http://taeric.github.io/DancingLinks.html
namespace dlx {
    export interface DlxLink<T> {
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
        private root: DlxLink<T>;
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

        private search(depth: number) {
            if (this.showSteps || this.root.right === this.root) {
                this.recordSolution(this.root.right === this.root);

                if (this.root.right === this.root) {
                    return;
                }
            }

            let column = this.smallestColumn();
            this.cover(column);

            let row = column.down;
            while (row !== column) {
                this.step(row, depth);

                row = row.right;
                while (row.col !== column) {
                    this.cover(row.col);
                    row = row.right;
                }
                this.search(depth + 1);
                row = row.left;
                while (row.col !== column) {
                    this.uncover(row.col);
                    row = row.left;
                }
                row = row.down;

                this.unstep();
            }
            this.uncover(column);
        }

        private step(row: DlxLink<T>, depth: number) {
          this.currentTree = {
              parent: this.currentTree,
              children: [],
              depth: depth,
              node: row.node
          };
          this.currentTree.parent.children.push(this.currentTree);

          this.currentSolution.push(row.node);
        }

        private recordSolution(success: boolean) {
          let solution = {
              nodes: _.clone(this.currentSolution),
              success: success
          };

          this.currentTree.success = success;
          this.solutions.push(solution);
        }

        private unstep() {
          this.currentSolution.pop();
          this.currentTree = this.currentTree.parent;
        }

        private cover(column: DlxLink<T>) {
            column.right.left = column.left;
            column.left.right = column.right;

            let row = column.down;
            while (row !== column) {
                row = row.right;
                while (row.col !== column) {
                    row.up.down = row.down;
                    row.down.up = row.up;
                    row.col.size--;
                    row = row.right;
                }
                row = row.down;
            }
        }

        private uncover(column: DlxLink<T>) {
            column.right.left = column;
            column.left.right = column;

            let row = column.up;
            while (row !== column) {
                row = row.left;
                while (row.col !== column) {
                    row.up.down = row;
                    row.down.up = row;
                    row.col.size++;
                    row = row.left;
                }
                row = row.up;
            }
        }

        private smallestColumn(): DlxLink<T> {
            let column: DlxLink<T>;
            let min = Number.MAX_VALUE;

            for (let header = this.root.right; header !== this.root; header = header.right) {
                if (header.size < min) {
                    column = header;
                    min = column.size;
                }
            }

            return column;
        }

        private initializeHeaders() {
            let rows: { [index: string]: DlxLink<T> } = {};

            this.root = {
                right: null,
                left: null,
                up: null,
                down: null
            };
            this.root.right = this.root;
            this.root.left = this.root;

            for (let i in this.constraintMatrix) {
                let column: DlxLink<T> = {
                    right: this.root,
                    left: this.root.left,
                    size: 0,
                    down: null,
                    up: null,
                };

                this.root.left.right = column;
                this.root.left = column;

                column.up = column;
                column.down = column;

                for (let j in this.constraintMatrix[i]) {
                    let constraint = this.constraintMatrix[i][j];
                    if (!constraint.value || constraint.skip) {
                        continue;
                    }
                    let row: DlxLink<T> = {
                        node: constraint.node,
                        right: null,
                        left: null,
                        down: column,
                        up: column.up,
                        col: column
                    };
                    column.size++;
                    column.up.down = row;
                    column.up = row;

                    // If we haven't seen this row yet, remember it. Otherwise,
                    // append this node to the row's left/right chain.
                    if (!rows[j]) {
                        row.right = row;
                        row.left = row;
                        rows[j] = row;
                    } else {
                        row.right = rows[j];
                        row.left = rows[j].left;
                        rows[j].left.right = row;
                        rows[j].left = row;
                    }
                }
            }
        }
    }
}
