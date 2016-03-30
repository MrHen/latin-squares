namespace LatinHive {
    export interface LatinHiveConfig {
        id?: string;
        height?: number;
        rootId?: string;
        size?: number;
        width?: number;
    }

    export interface LatinNode {
        i: number;
        x: number;
        y: number;
        guess: number;

        cell: square.LatinCell;

        solutions: LatinSolution[];
    }

    export interface LatinLink {
        key: string;
        solution: LatinSolution;
    }

    export class LatinHive {
        private static defaultConfig: LatinHiveConfig = {
            height: 400,
            id: "#hive-chart",
            rootId: "#hive-chart-container",
            size: 4,
            width: 400
        };

        private config: LatinHiveConfig;

        private svg: d3.Selection<LatinNode>;

        constructor(config?: LatinHiveConfig) {
            this.config = _.defaults({}, config, LatinHive.defaultConfig);

            this.svg = d3.select(this.config.rootId)
                .append("svg")
                .attr("id", this.config.id)
                .attr("width", this.config.width)
                .attr("height", this.config.height)
                .append("g")
                .attr("transform", "translate(" + this.config.width / 2 + "," + this.config.height / 2 + ")");
        }

        public drawNodes = (nodes: LatinNode[]) => {
            let node = this.svg.selectAll(".node")
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
                .style("fill", (node) => latinColors.getColor(node, highlight))
                .style("stroke", (node) => latinColors.getBorderColor(node, highlight));

            return newNodes;
        };

        public drawAxes = (cells: square.LatinCell[]) => {
            let line = this.svg.selectAll(".axis").data(cells);

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
                .style("stroke", (cell) => latinColors.getBorderColor(cell, highlight));

            return newLine;
        };

        public drawLinks = (links: LatinLink[], cells: square.LatinCell[]) => {
            let picked = _.filter(cells, "guess");

            let link = this.svg.selectAll(".link")
                .data(links, (link) => link.key);

            let newLinks = link.enter()
                .append("path")
                .attr("class", "link")
                .attr("d", hiveConfig.link)
                .style("opacity", 0)
                .style("fill", "none")
                .style("stroke-width", 1.5)
                .style("stroke", (link) => latinColors.linkColors(link.solution.s));

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

            return newLinks;
        };
    }

    export function buildNodes(cells: square.LatinCell[], size: number) {
        let nodes: LatinNode[] = [];

        for (let i = 0; i < cells.length; i++) {
            let cell = cells[i];

            for (let guess = 1; guess <= size; guess++) {
                let node = {
                    i: cell.i,
                    x: cell.x,
                    y: cell.y,
                    cell: cell,
                    guess: guess,
                    solutions: []
                };
                cell.nodes.push(node);
                nodes.push(node);
            }
        }

        return nodes;
    }

    export function buildLinks(nodes: LatinNode[], solutions: LatinSolution[]) {
        function key(d) {
            return d.x + ":" + d.y + ":" + d.guess;
        }

        let links: LatinLink[] = [];
        for (let s = 0; s < solutions.length; s++) {
            let solution = solutions[s];
            if (!solution.success) {
                continue;
            }

            solution.nodes = _.sortBy(solution.nodes, "i");
            solution.s = s;

            for (let i = 0; i < solution.nodes.length; i++) {
                let source = solution.nodes[i];
                let target = solution.nodes[(i + 1) % solution.nodes.length];

                let link = {
                    key: s + ":" + key(source) + ":" + key(target),
                    solution: solution,
                    source: source,
                    target: target
                };
                source.solutions.push(solution);
                links.push(link);
            }
        }

        return links;
    }
}
