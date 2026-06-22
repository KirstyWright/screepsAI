/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('build');
 * mod.thing == 'a thing'; // true
 */

import { Manager } from "manager";

export class BuildModule {
  static pathfinderCostIgnoreRoads = {
    plainCost: 2,
    swampCost: 10,
    roomCallback(roomName: string): CostMatrix {
      const room = Game.rooms[roomName];
      const costs = new PathFinder.CostMatrix();
      if (!room) return costs;

      room.find(FIND_STRUCTURES).forEach(function (struct) {
        if (struct.structureType === STRUCTURE_ROAD) {
          // Favor roads over plain tiles
          costs.set(struct.pos.x, struct.pos.y, 1);
        } else if (
          struct.structureType !== STRUCTURE_CONTAINER &&
          (struct.structureType !== STRUCTURE_RAMPART || !struct.my)
        ) {
          // Can't walk through non-walkable buildings
          costs.set(struct.pos.x, struct.pos.y, 0xff);
        }
        room.find(FIND_CREEPS).forEach(function (creep) {
          costs.set(creep.pos.x, creep.pos.y, 1);
        });
      });
      return costs;
    }
  };

  static run(manager: Manager) {
    if (manager.memory.buildQueue == undefined) {
      manager.memory.buildQueue = [];
    }
    this.buildExtensions(manager);
    if (
      _.filter(Game.creeps, creep => creep.memory.role == "builder" && creep.room.name == manager.room.name).length >=
        1 &&
      this.getCurrentSites(manager).length < 2
    ) {
      if (Game.time % 10 == 0) {
        this.buildExtensions(manager);
        // this.createRoads(manager);
      }
    }
  }
  static getCurrentSites(manager: Manager) {
    let results: ConstructionSite[] = [];
    for (const key in manager.memory.rooms) {
      const room = Game.rooms[manager.memory.rooms[key]];
      if (room) {
        results = results.concat(room.find(FIND_CONSTRUCTION_SITES));
      }
    }
    return results;
  }
  static createRoads(manager: Manager) {
    const search = manager.room.find(FIND_MY_STRUCTURES, {
      filter: { structureType: STRUCTURE_SPAWN }
    });
    const spawn = search[0];
    // roads to sources
    let roadsToBuild = 5;
    const sources = manager.memory.sources;
    // let sources = manager.room.find(FIND_SOURCES);
    for (const key in sources) {
      if (roadsToBuild <= 0) {
        break;
      }

      if (!Game.rooms[sources[key].pos.roomName]) {
        continue;
      }

      const pathFinder = PathFinder.search(
        new RoomPosition(sources[key].pos.x, sources[key].pos.y, sources[key].pos.roomName),
        {
          pos: spawn.pos,
          range: 1
        },
        {
          plainCost: 2,
          swampCost: 2,
          roomCallback: this.pathfinderCostIgnoreRoads.roomCallback
        }
      );
      for (const pathKey in pathFinder.path) {
        const pos = pathFinder.path[pathKey];
        if (
          !pos.lookFor(LOOK_STRUCTURES).length &&
          !pos.lookFor(LOOK_CONSTRUCTION_SITES).length &&
          this.getCurrentSites(manager).length < 2
        ) {
          if (Game.rooms[pos.roomName]) {
            Game.rooms[pos.roomName].createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
            roadsToBuild = roadsToBuild - 1;
          }
        }
      }
    }
    // roads to structures
    const structures = manager.room.find(FIND_STRUCTURES, {
      filter: structure => {
        return structure.structureType == STRUCTURE_CONTROLLER || structure.structureType == STRUCTURE_TOWER;
      }
    });
    for (const key in structures) {
      const structure = structures[key];
      const path = PathFinder.search(spawn.pos, { pos: structure.pos, range: 1 }, this.pathfinderCostIgnoreRoads);
      for (const pathKey in path.path) {
        if (roadsToBuild <= 0) {
          break;
        }
        const pos = path.path[pathKey];
        if (!pos.lookFor(LOOK_STRUCTURES).length && !pos.lookFor(LOOK_CONSTRUCTION_SITES).length) {
          // manager.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
          roadsToBuild = roadsToBuild - 1;
        }
      }
    }
  }
  static buildExtensions(manager: Manager) {
    // extensions build
    const search = manager.room.find(FIND_MY_STRUCTURES, {
      filter: { structureType: STRUCTURE_SPAWN }
    });
    const spawn = search[0];
    const currentExtensions = manager.room.find(FIND_STRUCTURES, {
      filter: structure => {
        return structure.structureType == STRUCTURE_EXTENSION;
      }
    });
    const extensionsMap: Record<number, number> = {
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
    if (!manager.room.controller) {
      return;
    }
    const numberOfExtensionsAvailable = extensionsMap[manager.room.controller.level];
    if (currentExtensions.length >= numberOfExtensionsAvailable || this.getCurrentSites(manager).length > 2) {
      return;
    }
    console.log("Building extensions");
    console.log(numberOfExtensionsAvailable);
    console.log(currentExtensions.length);
    console.log(this.getCurrentSites(manager).length);
    const tiles = manager.room.getTerrain();
    const options = [];
    const comparePos = (spawn.pos.x + 1 + spawn.pos.y) % 2;
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        if (
          (tiles.get(x, y) === 0 || tiles.get(x, y) === TERRAIN_MASK_SWAMP) && // plain or swamp
          (x + y) % 2 === comparePos // fancy pattern§
        ) {
          const results = manager.room.lookAt(x, y);
          let flag = false;
          for (const key in results) {
            // TODO: reformat this to ensure we use a single get all structures look as using lookAt alot is expensive
            if (results[key].type == "structure" || results[key].type == "constructionSite") {
              flag = true;
              break;
            }
          }
          if (!flag) {
            options.push({
              x,
              y
            });
          }
        }
      }
    }
    const sorted = options.sort((a, b) => {
      return spawn.pos.getRangeTo(a.x, a.y) - spawn.pos.getRangeTo(b.x, b.y);
    });
    if (sorted[0]) {
      spawn.room.createConstructionSite(sorted[0].x, sorted[0].y, STRUCTURE_EXTENSION);
    }
  }
}
// new RoomVisual(spawn.room.name).circle(pos,{fill:'orange'});
