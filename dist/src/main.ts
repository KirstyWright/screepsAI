import "prototype_creep";
import "prototype_spawner";
import { ErrorMapper } from "utils/ErrorMapper";
import { Manager } from "manager";
import { Stats } from "stats";
import { Directive } from "directive";
import { Cache } from "./cache/cache";
import "Traveler";

// declare var profiler: any;
import * as profiler from "./screeps-profiler";
import { Tick } from "Tick";

String.prototype.hashCode = function () {
  let hash = 0;
  if (this.length == 0) {
    return hash;
  }
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

const global = {
  cache: new Cache()
};
console.log("Global refreshed, rebuilding cache");
// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
profiler.enable();
export const loop = ErrorMapper.wrapLoop(() => {
  profiler.wrap(function () {
    for (const name in Memory.creeps) {
      if (!Memory.manager) {
        return;
      }
      if (!Game.creeps[name]) {
        const creep = Memory.creeps[name];
        if (creep.role == "miner") {
          if (creep.managerId === undefined) {
            console.log("Miner didn't have a manager at spawn");
            creep.managerId = 0;
          }
          const manager = Memory.manager[creep.managerId];
          for (const key in manager.sources) {
            const index = manager.sources[key].miners.indexOf(name);
            if (index != -1) {
              manager.sources[key].miners.splice(index, 1);
            }
          }
        }

        delete Memory.creeps[name];
      }
    }
    Tick.managers = [];
    Tick.directives = [];
    Tick.Profiler = null;
    Tick.routes = {};

    // Re-seed when uninitialised OR the managed room is no longer owned/visible.
    // Memory persists across a respawn, so a stale entry pointing at an old room
    // (e.g. W1S23) would otherwise crash `new Manager` every tick on this.room.find.
    if (!Memory.manager || Memory.manager.length == 0 || !Game.rooms[Memory.manager[0].room as string]) {
      const spawn = Game.spawns.Spawn1 || Object.values(Game.spawns)[0];
      if (spawn == undefined) {
        return;
      }
      Memory.manager = [
        {
          room: spawn.room.name,
          sources: [],
          rooms: [],
          creeps: [],
          spawnQueue: [],
          variables: {
            defenseLevel: 1,
            defenseLevelModifiedTick: Game.time
          }
        }
      ];
    }
    for (const key in Memory.manager) {
      Tick.managers[key] = new Manager(0);
      Tick.managers[key].init();
    }
    const flags: Flag[] = Object.values(Game.flags);
    flags.forEach(flag => {
      const directive = new Directive(flag);
      directive.init();
      Tick.directives.push(directive);
    });

    // RUN

    Tick.directives.forEach(directive => {
      directive.run();
    });

    for (const key in Tick.managers) {
      Tick.managers[key].run();
    }
    for (const name in Game.creeps) {
      if (Game.creeps[name].memory.managerId != undefined) {
        Game.creeps[name].manager = Tick.managers[Game.creeps[name].memory.managerId];
      }
      Game.creeps[name].run();
    }

    for (const key in Tick.managers) {
      Tick.managers[key].finish();
    }
    Stats.exportStats(Tick.managers);

    if (Game.cpu.bucket >= 10000) {
      if ("generatePixel" in Game.cpu) {
        Game.cpu.generatePixel();
      }
    }
  });
});
