/// <reference path="./builder.ts" />
function drawHiveNodes(nodes) {
    var node = hiveSvg.selectAll(".node")
        .data(nodes);
    var newNodes = node.enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function (node) {
        return "rotate(" + degrees(hiveConfig.angle(node.cell.i)) + ")translate(" + hiveConfig.radius(node.guess) + ",0)";
    })
        .on("mouseover", function (node) {
        highlight = createHighlight(node);
        draw();
    })
        .on("mouseout", function (node) {
        highlight = createHighlight();
        draw();
    });
    newNodes.append("circle")
        .attr("class", "inner")
        .style("r", 5)
        .style("stroke-width", 1.5);
    node.transition().duration(duration)
        .style("fill", function (node) { return getColor(node, highlight); })
        .style("stroke", function (node) { return getBorderColor(node, highlight); });
}
function drawHiveAxes(cells) {
    var line = hiveSvg.selectAll(".axis").data(cells);
    var newLine = line.enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", function (cell) {
        return "rotate(" + degrees(hiveConfig.angle(cell.i)) + ")";
    });
    newLine.append("line")
        .style("stroke-width", 1.5)
        .attr("x1", hiveConfig.radius.range()[0])
        .attr("x2", _.last(hiveConfig.radius.range()));
    line.selectAll("line")
        .transition().duration(duration)
        .style("stroke", function (cell) { return getBorderColor(cell, highlight); });
}
function drawHiveLinks(links, cells) {
    var picked = _.filter(cells, "guess");
    var link = hiveSvg.selectAll(".link")
        .data(links, function (link) { return link.key; });
    link.enter()
        .append("path")
        .attr("class", "link")
        .attr("d", hiveConfig.link)
        .style("opacity", 0)
        .style("fill", "none")
        .style("stroke-width", 1.5)
        .style("stroke", function (link) { return linkColors(link.solution.s); });
    link.exit()
        .transition().duration(duration)
        .style("opacity", 0)
        .remove();
    link.transition().duration(duration)
        .style("opacity", function (link) {
        if (!link.solution.valid) {
            return 0;
        }
        if (highlight && highlight.solutions.length) {
            var match = _.includes(highlight.solutions, link.solution.s);
            return match ? 1 : 0;
        }
        return 1;
    });
}
function drawLatin(cells) {
    var height = +latinSvg.attr("height");
    var width = +latinSvg.attr("width");
    var margin = 10;
    var maxWidth = (width - margin * 2) / size;
    var maxHeight = (height - margin * 2) / size;
    var cellSpacing = 2;
    var cellSize = Math.min(maxWidth, maxHeight) - cellSpacing;
    var offset = function (x) {
        return (x) * (cellSize + cellSpacing) + margin;
    };
    var cell = latinSvg.selectAll(".cell")
        .data(cells);
    var newCells = cell.enter()
        .append("g")
        .attr("class", "cell")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("transform", function (cell) {
        return "translate(" + offset(cell.x) + "," + offset(cell.y) + ")";
    })
        .on("mouseover", function (cell) {
        highlight = createHighlight(cell);
        draw();
    })
        .on("mouseout", function (cell) {
        highlight = createHighlight();
        draw();
    })
        .on("click", function (cell) {
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
        .attr("transform", function (cell) {
        return "translate(" + cellSize / 2 + "," + cellSize / 2 + ")";
    });
    cell.select(".box")
        .transition().duration(duration)
        .attr("stroke", function (cell) {
        return getBorderColor(cell, highlight);
    })
        .attr("fill", function (cell) {
        return getColor(cell, highlight);
    });
    cell.select(".label")
        .text(function (cell) {
        if (highlight && highlight.i === cell.i) {
            return highlight.guess;
        }
        if (cell.guess) {
            return cell.guess;
        }
        return null;
    })
        .attr("fill", function (cell) {
        return getTextColor(cell, highlight);
    });
}
function drawConstraints(constraints) {
    var height = constraintsSvg.attr("height");
    var width = constraintsSvg.attr("width");
    var columnIndex = "outer";
    var rowIndex = "inner";
    var pixelColor = d3.scale.linear()
        .domain([0, 1])
        .range([colors["invalid"], colors["valid"]]);
    var flat = _.flatten(_.map(_.values(constraints), _.values));
    var columnLabels = _.uniq(_.map(flat, columnIndex)).sort();
    var rowLabels = _.uniq(_.map(flat, rowIndex)).sort();
    var labelOffset = 4;
    var maxWidth = +width / (columnLabels.length + 2 + labelOffset);
    var maxHeight = +height / (rowLabels.length + 2 + labelOffset);
    var pixelSpacing = 1;
    var pixelSize = Math.min(maxWidth, maxHeight) - pixelSpacing;
    var labelSize = pixelSize * labelOffset;
    var offset = function (x) {
        return (x + 1) * (pixelSize + pixelSpacing);
    };
    var realWidth = (pixelSize + pixelSpacing) * (columnLabels.length + 2 + labelOffset);
    var realHeight = (pixelSize + pixelSpacing) * (rowLabels.length + 2 + labelOffset);
    constraintsSvg.attr("width", realWidth)
        .attr("height", realHeight);
    var pixel = constraintsSvg.selectAll("rect.pixel")
        .data(_.filter(flat, "value"));
    pixel.enter()
        .append("rect")
        .attr("class", "pixel")
        .attr("width", pixelSize)
        .attr("height", pixelSize)
        .style("stroke-width", 0.25)
        .attr("transform", function (constraint) {
        return "translate(" + offset(_.indexOf(columnLabels, constraint[columnIndex]) + labelOffset) + "," + offset(_.indexOf(rowLabels, constraint[rowIndex]) + labelOffset) + ")";
    })
        .on("mouseover", function (constraint) {
        if (constraint.value) {
            highlight = createHighlight(constraint.node);
            draw();
        }
    })
        .on("mouseout", function (constraint) {
        if (highlight) {
            highlight = createHighlight();
            draw();
        }
    });
    pixel.transition().duration(duration)
        .style("stroke", function (constraint) {
        if (!constraint.value) {
            return borders["filler"];
        }
        return getBorderColor(constraint.node, highlight);
    })
        .style("fill", function (constraint) {
        if (!constraint.value) {
            return colors["filler"];
        }
        return getColor(constraint.node, highlight);
    });
    var columns = constraintsSvg.selectAll("text.column")
        .data(columnLabels);
    columns.enter()
        .append("text")
        .attr("class", "column")
        .attr("transform", function (d, i) {
        return "translate(" + offset(labelOffset + i + 0.5) + "," + offset(labelOffset - 0.5) + ") rotate(270 0,0)";
    })
        .style("text-anchor", "start")
        .style("font-family", "monospace")
        .style("font-size", pixelSize)
        .text(function (d) { return d; });
    var rows = constraintsSvg.selectAll("text.row")
        .data(rowLabels);
    rows.enter()
        .append("text")
        .attr("class", "row")
        .attr("transform", function (d, i) {
        return "translate(" + offset(labelOffset - 0.5) + "," + offset(labelOffset + i + 0.5) + ")";
    })
        .style("text-anchor", "end")
        .style("font-family", "monospace")
        .style("font-size", pixelSize)
        .text(function (d) { return d; });
}
