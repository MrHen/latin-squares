/// <reference path="./builder.ts" />

function drawConstraints(constraints: LatinConstraintMatrix) {
    let height = constraintsSvg.attr("height");
    let width = constraintsSvg.attr("width");

    let columnIndex = "outer";
    let rowIndex = "inner";

    let pixelColor = d3.scale.linear<string, number>()
        .domain([0, 1])
        .range([latinColors.colors["invalid"], latinColors.colors["valid"]]);

    let flat: LatinConstraint[] = _.flatten<any>(_.map(_.values(constraints), _.values));
    let columnLabels: string[] = _.uniq(_.map<LatinConstraint, string>(flat, columnIndex)).sort();
    let rowLabels: string[] = _.uniq(_.map<LatinConstraint, string>(flat, rowIndex)).sort();

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
