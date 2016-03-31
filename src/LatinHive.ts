namespace LatinSquare {
    export interface HiveConfig {
        animationDuration?: number;
        id?: string;
        height?: number;
        rootId?: string;
        size?: number;
        width?: number;
    }

    export interface Node {
        i: number;
        x: number;
        y: number;
        guess: number;

        cell: LatinSquare.Cell;

        solutions: Solution[];
    }

    export interface Link {
        key: string;
        solution: Solution;
    }

    export interface Solution {
        nodes: LatinSquare.Node[];
        s?: number;
        success: boolean;
        valid?: boolean;
    }

    export class LatinHive {
        private static defaultConfig: HiveConfig = {
            animationDuration: 500,
            height: 400,
            id: "#hive-chart",
            rootId: "#hive-chart-container",
            size: 4,
            width: 400
        };

        private config: HiveConfig;

        private svg: d3.Selection<Node>;

        constructor(config?: HiveConfig) {
            this.config = _.defaults({}, config, LatinHive.defaultConfig);

            this.svg = d3.select(this.config.rootId)
                .append("svg")
                .attr("id", this.config.id)
                .attr("width", this.config.width)
                .attr("height", this.config.height)
                .append("g")
                .attr("transform", "translate(" + this.config.width / 2 + "," + this.config.height / 2 + ")");
        }

        public buildNodes = (cells: LatinSquare.Cell[]) => {
            let nodes: Node[] = [];

            for (let i = 0; i < cells.length; i++) {
                let cell = cells[i];

                for (let guess = 1; guess <= this.config.size; guess++) {
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
        };

        public buildLinks = (nodes: Node[], solutions: Solution[]) => {
            function key(d) {
                return d.x + ":" + d.y + ":" + d.guess;
            }

            let links: Link[] = [];
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
        };

        public drawNodes = (nodes: Node[]) => {
            let node = this.svg.selectAll(".node")
                .data(nodes);

            let newNodes = node.enter()
                .append("g")
                .attr("class", "node")
                .attr("transform", (node) => {
                    return "rotate(" + LatinHive.degrees(hiveConfig.angle(node.cell.i)) + ")translate(" + hiveConfig.radius(node.guess) + ",0)";
                });

            newNodes.append("circle")
                .attr("class", "inner")
                .style("r", 5)
                .style("stroke-width", 1.5);

            node.transition().duration(this.config.animationDuration)
                .style("fill", (node) => latinColors.getColor(node, highlight))
                .style("stroke", (node) => latinColors.getBorderColor(node, highlight));

            return newNodes;
        };

        public drawAxes = (cells: LatinSquare.Cell[]) => {
            let line = this.svg.selectAll(".axis").data(cells);

            let newLine = line.enter()
                .append("g")
                .attr("class", "axis")
                .attr("transform", (cell) => {
                    return "rotate(" + LatinHive.degrees(hiveConfig.angle(cell.i)) + ")";
                });

            newLine.append("line")
                .style("stroke-width", 1.5)
                .attr("x1", hiveConfig.radius.range()[0])
                .attr("x2", _.last<number>(hiveConfig.radius.range()));

            line.selectAll("line")
                .transition().duration(this.config.animationDuration)
                .style("stroke", (cell) => latinColors.getBorderColor(cell, highlight));

            return newLine;
        };

        public drawLinks = (links: Link[], cells: LatinSquare.Cell[]) => {
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
                .transition().duration(this.config.animationDuration)
                .style("opacity", 0)
                .remove();

            link.transition().duration(this.config.animationDuration)
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

        private static degrees = (radians: number) => {
            return radians / Math.PI * 180 - 90;
        };
    }
}
