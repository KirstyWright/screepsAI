import { RoleBuilder } from "./role/role.builder";
import { RoleHarvester } from "./role/role.harvester";
import { RoleUpgrader } from "./role/role.upgrader";
import { RoleMiner } from "./role/role.miner";
import { RoleHauler } from "./role/role.hauler";
import { RoleClaimer } from "./role/role.claimer";
import { RoleMilitia } from "./role/role.militia";
import { RoleDistributor } from "./role/role.distributor";
import { RoleScout } from "./role/role.scout";
import { RoleCengineer } from "./role/role.cengineer";
import { RoleCmedic } from "./role/role.cmedic";
import { Helper } from "helper";

export {};

const roles: Record<string, RoleRunner> = {
  harvester: RoleHarvester,
  upgrader: RoleUpgrader,
  builder: RoleBuilder,
  miner: RoleMiner,
  hauler: RoleHauler,
  claimer: RoleClaimer,
  militia: RoleMilitia,
  scout: RoleScout,
  distributor: RoleDistributor,
  cengineer: RoleCengineer,
  cmedic: RoleCmedic
};
const roleEmoji: Record<string, string> = {
  harvester: "⛏️",
  upgrader: "🔬",
  builder: "🛠️",
  miner: "⚠️",
  hauler: "🚚",
  claimer: "🏴‍☠️",
  militia: "⚔️",
  scout: "⚔️",
  distributor: "🧱",
  cengineer: "🧨",
  cmedic: "🚑"
};

Creep.prototype.genericRun = function (): boolean {
  if (!this.memory.lastPos) {
    this.memory.lastPos = null;
  }
  const currentPosString = Helper.savePos(this.pos);
  if (this.memory.lastPos === currentPosString) {
    this.idleMovement = true;
  } else {
    this.idleMovement = false;
  }

  new RoomVisual(this.room.name).text(roleEmoji[this.memory.role], this.pos.x, this.pos.y + 0.15, {
    color: "white",
    font: 0.5
  });

  if (!this.memory.respawn_complete) {
    if (this.memory.managerId != undefined) {
      if (Memory.manager[this.memory.managerId].creeps.indexOf(this.name) == -1) {
        Memory.manager[this.memory.managerId].creeps.push(this.name);
      }
      Memory.manager[this.memory.managerId].spawnQueue.splice(
        Memory.manager[this.memory.managerId].spawnQueue.findIndex(element => {
          return element.name === this.name;
        }),
        1
      );
    }
    this.memory.respawn_complete = true;
  }

  let moved = false;
  if (!["scout", "militia", "cengineer", "cmedic"].includes(this.memory.role)) {
    // check hostiles and flee
    const enemies = this.room.find(FIND_HOSTILE_CREEPS);
    for (const key in enemies) {
      if (this.pos.inRangeTo(enemies[key], 5)) {
        // check their body parts
        let attacker = false;
        for (let i = 0; i < enemies[key].body.length; i++) {
          if (enemies[key].body[i].type === ATTACK || enemies[key].body[i].type === RANGED_ATTACK) {
            attacker = true;
            break;
          }
        }
        if (attacker) {
          const path = PathFinder.search(
            this.pos,
            enemies.map(c => {
              return { pos: c.pos, range: 10 };
            }),
            { flee: true }
          ).path;
          this.moveByPath(path);
          moved = true;
          break;
        }
      }
    }

    // Spawner.manager.memory.rooms
  }

  // <StructureSpawn>
  if (this.idleMovement && this.memory.role != "distributor") {
    const spawns = this.room.find(FIND_MY_SPAWNS);
    for (const key in spawns) {
      const spawner = spawns[key];
      if (this.pos.inRangeTo(spawner.pos, 3)) {
        const route = PathFinder.search(
          this.pos,
          { pos: spawner.pos, range: 4 },
          {
            flee: true,
            roomCallback(roomName) {
              const costMatrix = new PathFinder.CostMatrix();

              const room = Game.rooms[roomName];
              if (!room) {
                return false;
              }

              room.find(FIND_STRUCTURES).forEach(function (struct) {
                if (
                  struct.structureType !== STRUCTURE_CONTAINER &&
                  struct.structureType !== STRUCTURE_ROAD &&
                  (struct.structureType !== STRUCTURE_RAMPART || !struct.my)
                ) {
                  // Can't walk through non-walkable buildings
                  costMatrix.set(struct.pos.x, struct.pos.y, 255);
                }
              });

              room.find(FIND_CREEPS).forEach(function (creep) {
                costMatrix.set(creep.pos.x, creep.pos.y, 255);
              });
              return costMatrix;
            }
          }
        );
        const path = route.path;
        this.moveByPath(path);
        moved = true;

        break;
      }
    }
  }
  return moved;
};

Creep.prototype.run = function () {
  if (this.spawning) {
    return;
  }

  const moved = this.genericRun();

  if (!moved) {
    roles[this.memory.role].run(this);
  }

  if (!this.fatigue) {
    this.memory.lastPos = Helper.savePos(this.pos);
  }
};

Creep.prototype.log = function (content) {
  console.log("Creep:" + this.name + ": " + String(content));
};

Creep.prototype.getManagerMemory = function () {
  return Memory.manager[this.memory.managerId];
};

Creep.prototype.getEnergy = function (useContainer?: boolean, useSource?: boolean, roomName?: string, taskPosition?: RoomPosition) {
  let container;
  let room = null;
  if (roomName) {
    room = Game.rooms[roomName];
  }
  if (this.memory.targetId) {
    // Is target valid?
    const target = Game.getObjectById(this.memory.targetId) as Structure | Resource | Tombstone | Ruin;
    if (!target || !target.pos) {
      this.memory.targetId = null;
      return;
    }
    // Collect from target
    if (target.pos.roomName !== this.room.name) {
      this.travelTo(target.pos);
    } else {
      let pickup;
      if ("store" in target) {
        pickup = this.withdraw(target, RESOURCE_ENERGY);
      } else if ("amount" in target) {
        pickup = this.pickup(target);
      } else {
        this.memory.targetId = null;
        return; // Should never get here as should be picked up by isValid
      }
      if (pickup == ERR_NOT_IN_RANGE) {
        this.travelTo(target);
      }
      return;
    }
  }

  // Find possible targets
  // Put them in an array and then find the "best" one
  // Base on distance from creep and how much energy is in the target
  const targets: { pos: RoomPosition; energy: number; id: Id<Structure> | Id<Resource> }[] = [];

  if (useContainer) {
    let obj = {
      filter: (i: AnyStructure) => {
        return (
          (i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE) &&
          i.store.energy > (["distributor"].includes(this.memory.role) ? 0 : 500)
        );
      }
    };
    if (room) {
      for (const key in room.find(FIND_STRUCTURES, obj)) {
        targets.push({
          pos: room.find(FIND_STRUCTURES, obj)[key].pos,
          energy: (room.find(FIND_STRUCTURES, obj)[key] as StructureContainer | StructureStorage).store.energy,
          id: room.find(FIND_STRUCTURES, obj)[key].id
        });
      }
    } else {
      for (const key in this.room.find(FIND_STRUCTURES, obj)) {
        targets.push({
          pos: this.room.find(FIND_STRUCTURES, obj)[key].pos,
          energy: (this.room.find(FIND_STRUCTURES, obj)[key] as StructureContainer | StructureStorage).store.energy,
          id: this.room.find(FIND_STRUCTURES, obj)[key].id
        });
      }
    }
  }

  if (container === undefined && useSource) {
    if (!this.memory.sourceId) {
      const sources = this.room.find(FIND_SOURCES);
      let sourceId = null;
      let thisCount = 9999;
      for (var key in sources) {
        const response = _.filter(Game.creeps, creep => creep.memory.sourceId == sources[key].id).length;
        if (response < thisCount) {
          sourceId = sources[key].id;
          thisCount = response;
        }
      }
      this.memory.sourceId = sourceId;
    }
    if (this.memory.sourceId) {
      const sources = this.getManagerMemory().sources;
      for (const key in sources) {
        if (sources[key].sourceId !== this.memory.sourceId) {
          continue;
        }
        if (this.memory.role != "miner") {
          break;
        }
        if (!sources[key].miners.includes(this.name)) {
          this.getManagerMemory().sources[key].miners.push(this.name);
        }
      }
      const target: Source | null = Game.getObjectById(this.memory.sourceId);
      if (target) {
        if (this.harvest(target) == ERR_NOT_IN_RANGE) {
          this.travelTo(target);
          return;
        }
      }
    }
  }

  // Look for energy on the ground as fallback
  const groundEnergy = this.room.find(FIND_DROPPED_RESOURCES, {
    filter: (resource: Resource) => {
      return resource.resourceType == RESOURCE_ENERGY && resource.amount > 100;
    }
  });
  // for grounEnergy add to targets
  for (const key in groundEnergy) {
    targets.push({ pos: groundEnergy[key].pos, energy: groundEnergy[key].amount, id: groundEnergy[key].id });
  }

  // Sort targets by energy & distance (to generate a score)
  let pos = taskPosition || this.pos;
  targets.sort((a, b) => {
    const aScore = Math.min(a.energy, this.store.getCapacity())  / (pos.getRangeTo(a.pos) + 1);
    const bScore = Math.min(b.energy, this.store.getCapacity()) / (pos.getRangeTo(b.pos) + 1);
    return aScore > bScore ? -1 : 1;
  });
  for (const key in targets) {
    console.log("Target ", targets[key].id, ' / ', targets[key].energy, ' / ', pos.getRangeTo(targets[key].pos), ' / ', Math.min(targets[key].energy, this.store.getCapacity()) + pos.getRangeTo(targets[key].pos));
  }
  if (targets.length > 0) {
    this.memory.targetId = targets[0].id;
  }
};

Creep.prototype.moveToPos = function (pos, opts) {
  if (opts == undefined) {
    opts = {};
  }
  opts.reusePath = 20;
  opts.ignoreCreeps = true;
  if (opts.costCallback == undefined) {
    opts.costCallback = (roomName: string, costMatrix: { set: (arg0: number, arg1: number, arg2: number) => void }) => {
      for (const name in Game.creeps) {
        if (Game.creeps[name].room.name == roomName) {
          costMatrix.set(Game.creeps[name].pos.x, Game.creeps[name].pos.y, 5);
        }
      }
    };
  }

  return this.moveTo(pos, opts);
};

Creep.prototype.findInManagerRooms = function <K extends FindConstant>(
  this: Creep,
  type: K,
  opts?: FilterOptions<FindTypes[K], FindTypes[K]>
): FindTypes[K][] {
  let results: FindTypes[K][] = [];
  for (const key in this.manager.memory.rooms) {
    const room = Game.rooms[this.manager.memory.rooms[key]];
    if (room) {
      results = results.concat(room.find(type, opts));
    }
  }
  return results;
};
