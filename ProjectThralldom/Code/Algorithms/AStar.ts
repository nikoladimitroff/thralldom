/// <reference path="graphdefinitions.ts" />
module Thralldom {
    export module Algorithms {
        export class AStar {
            public static runQuery(graph: IGraph, start: Vertex, goal: Vertex): Array<Vertex> {

                return AStar.aStar(start, goal, graph.nodes, graph.edges);
            }


            private static neighbourNodes(node: Vertex, points: Array<Vertex>, edges: Array<Edge>): Array<Vertex> {
                var index = points.indexOf(node);
                var neighbours = [];
                for (var i = 0; i < edges.length; i++) {
                    var edge = edges[i];
                    if (edge.first == index && edge.second != index) {
                        neighbours.push(points[edge.second]);
                    }
                    if (edge.second == index && edge.first != index) {
                        neighbours.push(points[edge.first]);
                    }
                }

                return neighbours;
            }

            private static aStar(start: Vertex, goal: Vertex, points: Array<Vertex>, edges: Array<Edge>): Array<Vertex> {
                var closedset = []    // The set of nodes already evaluated.
                var openset = [start] // The set of tentative nodes to be evaluated, initially containing the start node
                var came_from: any = {}    // The map of navigated nodes.
                var g_score: any = {}
                var f_score: any = {};

                g_score[start] = 0    // Cost from start along best known path.
                // Estimated total cost from start to goal through y.
                f_score[start] = g_score[start] + start.distanceTo(goal);

                while (openset.length) {
                    // the node in openset having the lowest f_score[] value
                    var current = openset.sort(function (x, y) { return f_score[x] - f_score[y] })[0];
                    if (current == goal) {
                        return AStar.reconstruct_path(came_from, goal)
                    }

                    openset.removeUnstable(current);//remove current from openset

                    closedset.push(current); //add current to closedset
                    var neighbours = AStar.neighbourNodes(current, points, edges);
                    for (var i = 0; i < neighbours.length; i++) {
                        var neighbour = neighbours[i];
                        if (closedset.indexOf(neighbour) != -1) {
                            continue;
                        }
                        var tentative_g_score = g_score[current] + current.distanceTo(neighbour);

                        if (openset.indexOf(neighbour) == -1 || tentative_g_score < g_score[neighbour]) {
                            came_from[neighbour] = current;
                            g_score[neighbour] = tentative_g_score;
                            f_score[neighbour] = g_score[neighbour] + neighbour.distanceTo(goal);
                            if (openset.indexOf(neighbour) == -1) {
                                openset.push(neighbour);
                            }
                        }
                    }
                }

                return [];
            }

            //private static reconstruct_path(came_from: any, current_node: Vertex): Array<Vertex> {
            //    if (came_from[current_node]) {
            //        var p = AStar.reconstruct_path(came_from, came_from[current_node])
            //        return p.concat([current_node]);
            //    }
            //    return [current_node];
            //}

            private static reconstruct_path(came_from: any, current_node: Vertex): Array<Vertex> {
                var stack = [];

                var node = current_node;
                var path = [];
                while (came_from[node]) {
                    stack.push(node);
                    node = came_from[node];
                }
                while (stack.length != 0) path.push(stack.pop());

                return path;
            }
        }
    }
} 