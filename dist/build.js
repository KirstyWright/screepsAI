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
    run: function(manager) {

        if (manager.memory.buildQueue == undefined) {
            manager.memory.buildQueue = [];
        }
        // if (_.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && creep.room.id == manager.room.id).length > 0 && this.getCurrentSites(spawn) < 2) {
            this.createRoads(manager);
            this.buildExtensions(manager);
        // }
    },
    getCurrentSites: function(manager) {
        return manager.room.find(FIND_CONSTRUCTION_SITES);
    },
    createRoads(manager) {
        let roads = manager.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_ROAD;
            }
        });
        let search = manager.room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_SPAWN }
        });
        let spawn = search[0];
        // roads to sources
        let sources = manager.memory.sources;
        // let sources = manager.room.find(FIND_SOURCES);
        for (let key in sources) {
            let pathFinder = PathFinder.search(sources[key].pos, {
                pos: spawn.pos,
                range: 0
            });
            for (var pathKey in pathFinder.path) {
                let pos = pathFinder.path[pathKey];
                if (!pos.lookFor(LOOK_STRUCTURES).length && !pos.lookFor(LOOK_CONSTRUCTION_SITES).length && this.getCurrentSites(manager) < 2) {
                    if (pos.roomName == spawn.room.name) {
                        manager.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                    }
                }
            }
        }

        // roads to controller
        let controller = manager.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_CONTROLLER;
            }
        })[0];
        let pathToController = PathFinder.search(controller.pos, sources, this.pathfinderCostIgnoreRoads);
        for (var pathKey in pathToController.path) {
            let pos = pathToController.path[pathKey];
            if (!pos.lookFor(LOOK_STRUCTURES).length && !pos.lookFor(LOOK_CONSTRUCTION_SITES).length) {
                manager.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
            }
        }

        let pathFinder = PathFinder.search(controller.pos, roads);
    },
    buildExtensions: function(manager) {
        // extensions build
        let search = manager.room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_SPAWN }
        });
        let spawn = search[0];
        let currentExtensions = manager.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_EXTENSION;
            }
        });
        let flag = false;
        let areaToSearch = 3;

        let extensionsMap = {
            0: 0,
            1: 0,
            2: 5,
            3: 10,
            4: 20,
            5: 30,
            6: 40,
            7: 50,
            8: 60
        };
        let numberOfExtensionsAvailable = extensionsMap[manager.room.controller.level]
        if (currentExtensions.length < numberOfExtensionsAvailable && this.getCurrentSites(manager).length < 2) {
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
