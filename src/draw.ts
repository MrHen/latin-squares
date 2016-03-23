/// <reference path="./builder.ts" />

function drawHiveNodes(nodes: LatinNode[]) {
    let node = hiveSvg.selectAll(".node")
        .data(nodes);

    let newNodes = node.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (node) => {
            return "rotate(" + degrees(hiveConfig.angle(node.cell.i)) + ")translate(" + hiveConfig.radius(node.guess) + ",0)";
        })
        .on("mouseover", (node) => {
            highlight = createHighlight(node);
            draw();
        })
        .on("mouseout", (node) => {
            highlight = createHighlight();
            draw();
        });

    newNodes.append("circle")
        .attr("class", "inner")
        .style("r", 5)
        .style("stroke-width", 1.5);

    node.transition().duration(duration)
        .style("fill", (node) => getColor(node, highlight))
        .style("stroke", (node) => getBorderColor(node, highlight));
}

function drawHiveAxes(cells: LatinCell[]) {
    let line = hiveSvg.selectAll(".axis").data(cells);

    let newLine = line.enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", (cell) => {
            return "rotate(" + degrees(hiveConfig.angle(cell.i)) + ")";
        });

    newLine.append("line")
        .style("stroke-width", 1.5)
        .attr("x1", hiveConfig.radius.range()[0])
        .attr("x2", _.last<number>(hiveConfig.radius.range()));

    line.selectAll("line")
        .transition().duration(duration)
        .style("stroke", (cell) => getBorderColor(cell, highlight));
}

function drawHiveLinks(links: LatinLink[], cells: LatinCell[]) {
    let picked = _.filter(cells, "guess");

    let link = hiveSvg.selectAll(".link")
        .data(links, (link) => link.key);

    link.enter()
        .append("path")
        .attr("class", "link")
        .attr("d", hiveConfig.link)
        .style("opacity", 0)
        .style("fill", "none")
        .style("stroke-width", 1.5)
        .style("stroke", (link) => linkColors(link.solution.s));

    link.exit()
        .transition().duration(duration)
        .style("opacity", 0)
        .remove();

    link.transition().duration(duration)
        .style("opacity", (link) => {
            if (!link.solution.valid) {
                return 0;
            }

            if (highlight && highlight.solutions.length) {
                let match = _.includes(highlight.solutions, link.solution.s);
                return match ? 1 : 0;
            }

            return 1;
        });
}

function drawLatin(cells: LatinCell[]) {
    let height = +latinSvg.attr("height");
    let width = +latinSvg.attr("width");

    let margin = 10;
    let maxWidth = (width - margin * 2) / size;
    let maxHeight = (height - margin * 2) / size;

    let cellSpacing = 2;
    let cellSize = Math.min(maxWidth, maxHeight) - cellSpacing;

    let offset = (x) => {
        return (x) * (cellSize + cellSpacing) + margin;
    };

    let cell = latinSvg.selectAll(".cell")
        .data(cells);

    let newCells = cell.enter()
        .append("g")
        .attr("class", "cell")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("transform", (cell) => {
            return "translate(" + offset(cell.x) + "," + offset(cell.y) + ")";
        })
        .on("mouseover", (cell) => {
            highlight = createHighlight(cell);
            draw();
        })
        .on("mouseout", (cell) => {
            highlight = createHighlight();
            draw();
        })
        .on("click", (cell) => {
            console.log("cell debug", cell);

            if (!cell.hint) {
                cell.guess = (((cell.guess || 0) + 1) % (size + 1)) || null;

                update();
                highlight = createHighlight(cell);
                draw();
            }
        });

    newCells.append("rect")
        .attr("class", "box")
        .attr("fill", "white")
        .attr("stroke", "grey")
        .attr("width", cellSize)
        .attr("height", cellSize);

    newCells.append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .style("font-size", cellSize * 0.3)
        .attr("dominant-baseline", "central")
        .attr("transform", (cell) => {
            return "translate(" + cellSize / 2 + "," + cellSize / 2 + ")";
        });

    cell.select(".box")
        .transition().duration(duration)
        .attr("stroke", (cell) => {
            return getBorderColor(cell, highlight);

        })
        .attr("fill", (cell) => {
            return getColor(cell, highlight);
        });

    cell.select(".label")
        .text((cell) => {
            if (highlight && highlight.i === cell.i) {
                return highlight.guess;
            }

            if (cell.guess) {
                return cell.guess;
            }

            return null;
        })
        .attr("fill", (cell) => {
            return getTextColor(cell, highlight);
        });
}

function drawConstraints(constraints: LatinConstraintMatrix) {
    let height = constraintsSvg.attr("height");
    let width = constraintsSvg.attr("width");

    let columnIndex = "outer";
    let rowIndex = "inner";

    let pixelColor = d3.scale.linear<string, number>()
        .domain([0, 1])
        .range([colors["invalid"], colors["valid"]]);

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
                return borders["filler"];
            }

            return getBorderColor(constraint.node, highlight);
        })
        .style("fill", (constraint) => {
            if (!constraint.value) {
                return colors["filler"];
            }

            return getColor(constraint.node, highlight);
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
