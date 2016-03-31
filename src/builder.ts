/// <reference path="./LatinHive.ts" />

namespace LatinConstraint {
    export interface LatinConstraint {
        inner: string;
        node: LatinHive.LatinNode;
        outer: string;
        skip: boolean;
        value: boolean;
    }

    export interface LatinConstraintMatrix {
        [outer: string]: {
            [inner: string]: LatinConstraint;
        };
    }

    // Generate a suitable constraints matrix. Columns are the outer dimension
    // (R1#1, R1#2, etc.) and rows are the inner dimension (R1C1#1, R1C1#2, etc.).
    //
    // Dancing links will convert these to a linked matrix but it is a little
    // easier to grok what is happening if we split up the constraint generation
    // and the linked matrix builder.
    export function buildConstraints(size: number, nodes: LatinHive.LatinNode[]) {
        let sparse = false;
        let matrix: LatinConstraintMatrix = {};

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

            let constraint: LatinConstraint;
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

    export function drawConstraints(constraints: LatinConstraint.LatinConstraintMatrix) {
        let height = constraintsSvg.attr("height");
        let width = constraintsSvg.attr("width");

        let columnIndex = "outer";
        let rowIndex = "inner";

        let pixelColor = d3.scale.linear<string, number>()
            .domain([0, 1])
            .range([latinColors.colors["invalid"], latinColors.colors["valid"]]);

        let flat: LatinConstraint.LatinConstraint[] = _.flatten<any>(_.map(_.values(constraints), _.values));
        let columnLabels: string[] = _.uniq(_.map<LatinConstraint.LatinConstraint, string>(flat, columnIndex)).sort();
        let rowLabels: string[] = _.uniq(_.map<LatinConstraint.LatinConstraint, string>(flat, rowIndex)).sort();

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

        constraintsSvg.attr("width", realWidth)
            .attr("height", realHeight);

        let pixel = constraintsSvg.selectAll("rect.pixel")
            .data(_.filter(flat, "value"));

        pixel.enter()
            .append("rect")
            .attr("class", "pixel")
            .attr("width", pixelSize)
            .attr("height", pixelSize)
            .style("stroke-width", 0.25)
            .attr("transform", (constraint) => {
                return "translate(" + offset(_.indexOf(columnLabels, constraint[columnIndex]) + labelOffset) + "," + offset(_.indexOf(rowLabels, constraint[rowIndex]) + labelOffset) + ")";
            })
            .on("mouseover", (constraint) => {
                if (constraint.value) {
                    highlight = createHighlight(constraint.node);
                    draw();
                }
            })
            .on("mouseout", (constraint) => {
                if (highlight) {
                    highlight = createHighlight();
                    draw();
                }
            });

        pixel.transition().duration(duration)
            .style("stroke", (constraint) => {
                if (!constraint.value) {
                    return latinColors.borders["filler"];
                }

                return latinColors.getBorderColor(constraint.node, highlight);
            })
            .style("fill", (constraint) => {
                if (!constraint.value) {
                    return latinColors.colors["filler"];
                }

                return latinColors.getColor(constraint.node, highlight);
            });

        let columns = constraintsSvg.selectAll("text.column")
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

        let rows = constraintsSvg.selectAll("text.row")
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
    }
}
