/// <reference path="graphdefinitions.ts" />
module Thralldom {
    export module Algorithms {
        export class AStar {            
            public static runQuery(graph: IGraph, start: Rectangle, goal: Rectangle): Array<Rectangle> {
                return AStar.aStar(start, goal, graph);
            }

            public static runQueryOnVectors(graph: IGraph, start: THREE.Vector2, goal: THREE.Vector2): Array<Rectangle> {
                var startNode = undefined,
                    goalNode = undefined;

                for (var i = 0; i < graph.nodes.length; i++) {
                    var node = graph.nodes[i];

                    if (!startNode && node.contains(start))
                        startNode = node;
                    if (!goalNode && node.contains(goal))
                        goalNode = node;
                }

                var queryResult = AStar.aStar(startNode, goalNode, graph);
                return queryResult;
            }

            private static aStar(start: Rectangle, goal: Rectangle, graph: IGraph): Array<Rectangle> {
                var points = graph.nodes,
                    edges = graph.edges;

                var closedset = new Set<Rectangle>();    // The set of nodes already evaluated.
                var openset = new Set<Rectangle>(start); // The set of tentative nodes to be evaluated, initially containing the start node
                var came_from = new Map<Rectangle, Rectangle>();   // The map of navigated nodes.
                var g_score = new Map<Rectangle, number>();
                var f_score = new Map<Rectangle, number>();

                g_score.setValue(start, 0)    // Cost from start along best known path.
                // Estimated total cost from start to goal.
                f_score.setValue(start, start.distanceTo(goal));

                while (openset.length) {
                    // the node in openset having the lowest f_score[] value
                    var current = openset.min((x, y) => f_score.getValue(x) < f_score.getValue(y));
                    if (current == goal) {
                        return AStar.reconstruct_path(came_from, goal)
                    }

                    openset.remove(current);
                    closedset.add(current);

                    var neighbours = edges[current.hash()].map(i => points[i]);
                    for (var i = 0; i < neighbours.length; i++) {
                        var neighbour = neighbours[i];
                        if (closedset.contains(neighbour)) {
                            continue;
                        }
                        var tentative_g_score = g_score.getValue(current) + current.distanceTo(neighbour);

                        if (!openset.contains(neighbour) || tentative_g_score < g_score.getValue(neighbour)) {
                            came_from.setValue(neighbour, current);
                            g_score.setValue(neighbour, tentative_g_score);
                            f_score.setValue(neighbour, g_score.getValue(neighbour) + neighbour.distanceTo(goal));
                            if (!openset.contains(neighbour)) {
                                openset.add(neighbour);
                            }
                        }
                    }
                }

                return [];
            }

            private static reconstruct_path(came_from: Map<Rectangle, Rectangle>, goal: Rectangle): Array<Rectangle> {
                var stack = [];

                var node = goal;
                var path = [];
                while (node) {
                    stack.push(node);
                    node = came_from.getValue(node);
                }
                while (stack.length != 0) path.push(stack.pop());

                return path;
            }
        }
    }
} 