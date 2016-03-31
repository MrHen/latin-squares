/// <reference path="./LatinHive.ts" />

namespace LatinSquare {
    export interface Constraint {
        inner: string;
        node: LatinSquare.Node;
        outer: string;
        skip: boolean;
        value: boolean;
    }

    export interface ConstraintMatrix {
        [outer: string]: {
            [inner: string]: Constraint;
        };
    }

    export interface ConstraintConfig {
        animationDuration?: number;
        id?: string;
        height?: number;
        rootId?: string;
        width?: number;
    }

    export class LatinConstraint {
        private static defaultConfig: ConstraintConfig = {
            animationDuration: 500,
            height: 400,
            id: "#constraints",
            rootId: "#constraints-container",
            width: 400
        };

        private config: ConstraintConfig;

        private svg: d3.Selection<Constraint>;

        constructor(config?: ConstraintConfig) {
            this.config = _.defaults({}, config, LatinConstraint.defaultConfig);

            this.svg = d3.select(this.config.rootId)
                .append("svg")
                .attr("id", this.config.id)
                .attr("width", this.config.width)
                .attr("height", this.config.height);
        }

        // Generate a suitable constraints matrix. Columns are the outer dimension
        // (R1#1, R1#2, etc.) and rows are the inner dimension (R1C1#1, R1C1#2, etc.).
        //
        // Dancing links will convert these to a linked matrix but it is a little
        // easier to grok what is happening if we split up the constraint generation
        // and the linked matrix builder.
        public build(size: number, nodes: LatinSquare.Node[]) {
            let sparse = false;
            let matrix: ConstraintMatrix = {};

            // Use the existing data cells instead of three loops so we can prune hints
            nodes.forEach((node) => {
                let i = node.cell.y + 1;
                let j = node.cell.x + 1;
                let k = node.guess;

                let key = "R" + i + "C" + j;
                let skip = node.cell.guess && node.cell.guess !== k;

                if (sparse && skip) {
                    return;
                }

                let constraint: Constraint;
                for (let a = 1; a <= size; a++) {
                    for (let b = 1; b <= size; b++) {
                        matrix["R" + a + "#" + b] = matrix["R" + a + "#" + b] || {};
                        matrix["C" + a + "#" + b] = matrix["C" + a + "#" + b] || {};
                        matrix["R" + a + "C" + b] = matrix["R" + a + "C" + b] || {};

                        constraint = {
                            outer: "R" + a + "#" + b,
                            inner: key + "#" + k,
                            node: node,
                            skip: skip,
                            value: (a === i && b === k)
                        };

                        if (constraint.value || !sparse) {
                            matrix[constraint.outer][constraint.inner] = constraint;
                        }

                        constraint = {
                            outer: "C" + a + "#" + b,
                            inner: key + "#" + k,
                            node: node,
                            skip: skip,
                            value: (a === j && b === k)
                        };

                        if (constraint.value || !sparse) {
                            matrix[constraint.outer][constraint.inner] = constraint;
                        }

                        constraint = {
                            outer: "R" + a + "C" + b,
                            inner: key + "#" + k,
                            node: node,
                            skip: skip,
                            value: (a === i && b === j)
                        };

                        if (constraint.value || !sparse) {
                            matrix[constraint.outer][constraint.inner] = constraint;
                        }
                    }
                }

            });

            return matrix;
        }

        public draw(constraints: LatinSquare.ConstraintMatrix) {
            let height = this.config.height;
            let width = this.config.width;

            let columnIndex = "outer";
            let rowIndex = "inner";

            let pixelColor = d3.scale.linear<string, number>()
                .domain([0, 1])
                .range([latinColors.colors["invalid"], latinColors.colors["valid"]]);

            let flat: LatinSquare.Constraint[] = _.flatten<any>(_.map(_.values(constraints), _.values));
            let columnLabels: string[] = _.uniq(_.map<LatinSquare.Constraint, string>(flat, columnIndex)).sort();
            let rowLabels: string[] = _.uniq(_.map<LatinSquare.Constraint, string>(flat, rowIndex)).sort();

            let labelOffset = 4;
            let maxWidth = +width / (columnLabels.length + 2 + labelOffset);
            let maxHeight = +height / (rowLabels.length + 2 + labelOffset);

            let pixelSpacing = 1;
            let pixelSize = Math.min(maxWidth, maxHeight) - pixelSpacing;
            let labelSize = pixelSize * labelOffset;
            let offset = (x) => {
                return (x + 1) * (pixelSize + pixelSpacing);
            };

            let realWidth = (pixelSize + pixelSpacing) * (columnLabels.length + 2 + labelOffset);
            let realHeight = (pixelSize + pixelSpacing) * (rowLabels.length + 2 + labelOffset);

            this.svg.attr("width", realWidth)
                .attr("height", realHeight);

            let pixel = this.svg.selectAll("rect.pixel")
                .data(_.filter(flat, "value"));

            let newPixels = pixel.enter()
                .append("rect")
                .attr("class", "pixel")
                .attr("width", pixelSize)
                .attr("height", pixelSize)
                .style("stroke-width", 0.25)
                .attr("transform", (constraint) => {
                    return "translate(" + offset(_.indexOf(columnLabels, constraint[columnIndex]) + labelOffset) + "," + offset(_.indexOf(rowLabels, constraint[rowIndex]) + labelOffset) + ")";
                });

            pixel.transition().duration(this.config.animationDuration)
                .style("stroke", (constraint) => {
                    if (!constraint.value) {
                        return latinColors.borders["filler"];
                    }

                    return latinColors.getBorderColor(constraint.node, LatinSquare.getHighlight());
                })
                .style("fill", (constraint) => {
                    if (!constraint.value) {
                        return latinColors.colors["filler"];
                    }

                    return latinColors.getColor(constraint.node, LatinSquare.getHighlight());
                });

            let columns = this.svg.selectAll("text.column")
                .data(columnLabels);

            columns.enter()
                .append("text")
                .attr("class", "column")
                .attr("transform", (d, i) => {
                    return "translate(" + offset(labelOffset + i + 0.5) + "," + offset(labelOffset - 0.5) + ") rotate(270 0,0)";
                })
                .style("text-anchor", "start")
                .style("font-family", "monospace")
                .style("font-size", pixelSize)
                .text((d) => d);

            let rows = this.svg.selectAll("text.row")
                .data(rowLabels);

            rows.enter()
                .append("text")
                .attr("class", "row")
                .attr("transform", (d, i) => {
                    return "translate(" + offset(labelOffset - 0.5) + "," + offset(labelOffset + i + 0.5) + ")";
                })
                .style("text-anchor", "end")
                .style("font-family", "monospace")
                .style("font-size", pixelSize)
                .text((d) => d);

            return newPixels;
        }
    }
}
