/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('build');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    pathfinderCostIgnoreRoads: {
        plainCost: 2,
        swampCost: 10,
        roomCallback: function(roomName) {

            let room = Game.rooms[roomName];
            if (!room) return;
            let costs = new PathFinder.CostMatrix;

            room.find(FIND_STRUCTURES).forEach(function(struct) {
                if (struct.structureType === STRUCTURE_ROAD) {
                    // Favor roads over plain tiles
                    costs.set(struct.pos.x, struct.pos.y, 2);
                } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                    (struct.structureType !== STRUCTURE_RAMPART ||
                        !struct.my)) {
                    // Can't walk through non-walkable buildings
                    costs.set(struct.pos.x, struct.pos.y, 0xff);
                }
                room.find(FIND_CREEPS).forEach(function(creep) {
                    costs.set(creep.pos.x, creep.pos.y, 0);
                });
            });
            return costs;
        }
    },
    run: function(spawn) {
        if (spawn.room.memory.buildQueue == undefined) {
            spawn.room.memory.buildQueue = [];
        }
        if (_.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && creep.room.id == spawn.room.id).length > 0 && this.getCurrentSites(spawn) < 2) {
            this.createRoads(spawn);
            this.buildExtensions(spawn);
        }
    },
    getCurrentSites: function(spawn) {
        return spawn.room.find(FIND_CONSTRUCTION_SITES);
    },
    createRoads(spawn) {
        let roads = spawn.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_ROAD;
            }
        });
        // roads to sources
        let sources = spawn.room.find(FIND_SOURCES);
        for (let key in sources) {
            let pathFinder = PathFinder.search(sources[key].pos, {
                pos: spawn.pos,
                range: 0
            });
            for (var pathKey in pathFinder.path) {
                let pos = pathFinder.path[pathKey];
                if (!pos.lookFor(LOOK_STRUCTURES).length && !pos.lookFor(LOOK_CONSTRUCTION_SITES).length && this.getCurrentSites(spawn) < 2) {
                    spawn.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                }
            }
        }

        // roads to controller
        let controller = spawn.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_CONTROLLER;
            }
        })[0];
        let pathToController = PathFinder.search(controller.pos, sources, this.pathfinderCostIgnoreRoads);
        for (var pathKey in pathToController.path) {
            let pos = pathToController.path[pathKey];
            if (!pos.lookFor(LOOK_STRUCTURES).length && !pos.lookFor(LOOK_CONSTRUCTION_SITES).length) {
                spawn.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                // new RoomVisual(spawn.room.name).circle(pos,{fill:'orange'});
            }
        }

        let pathFinder = PathFinder.search(controller.pos, roads);
    },
    buildExtensions: function(spawn) {
        // extensions build
        let currentExtensions = spawn.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_EXTENSION;
            }
        });
        let flag = false;
        let areaToSearch = 1;
        if (currentExtensions.length < 5 && this.getCurrentSites(spawn) < 1) {
            for (var x = (spawn.pos.x - areaToSearch); x < (spawn.pos.x + areaToSearch); x++) {
                if (flag) {
                    break;
                }
                for (var y = (spawn.pos.y - areaToSearch); y < (spawn.pos.y + areaToSearch); y++) {
                    let roomPos = new RoomPosition(x, y, spawn.room.name);
                    if (roomPos.lookFor(LOOK_TERRAIN) != 'wall' && roomPos.lookFor(LOOK_STRUCTURES) == false) {
                        spawn.room.createConstructionSite(x, y, STRUCTURE_EXTENSION);
                        flag = true;
                        break;
                    }
                }
            }
        }
    }
};
// new RoomVisual(spawn.room.name).circle(pos,{fill:'orange'});
