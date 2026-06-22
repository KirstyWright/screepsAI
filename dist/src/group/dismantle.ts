import { Group } from "./group";

export class GroupDismantle extends Group {
  targetRoom: string;

  constructor(stage: string, targetRoom: string, recruitWhenEnded: boolean) {
    super();
    this.requiredCreeps = ["cengineer", "cmedic"];
    this.type = "dismantle";
    this.stage = stage;
    this.targetRoom = targetRoom;
    this.recruitWhenEnded = recruitWhenEnded;
    this.hash = String(this.type + targetRoom).hashCode();
  }

  run() {
    if (!this.manager) {
      return;
    }

    const tempList = this.requiredCreeps;
    for (const key in this.manager.creeps) {
      const creep = this.manager.creeps[key];
      if (creep.memory.groupHash == this.hash) {
        const index = tempList.indexOf(creep.memory.role);
        if (index >= 0) {
          this.creeps.push(creep);
          tempList.splice(index, 1);
        }
      }
    }
    if (this.stage === "RECRUITING" && tempList.length == 0) {
      this.stage = "ACTIVE";
      this.log("Switching to ACTIVE");
    } else if (this.stage == "ACTIVE" && this.creeps.length == 0) {
      if (this.recruitWhenEnded) {
        this.stage = "RECRUITING";
        this.log("Switching to RECRUITING");
      } else {
        this.deleteGroup();
      }
    }

    if (this.stage === "RECRUITING") {
      this.scheduleCreeps(tempList);
    }

    if (this.stage === "ACTIVE") {
      this.activeRun();
    }
  }

  storageData(): ManagerMemoryGroup {
    return {
      type: this.type,
      stage: this.stage,
      targetRoom: this.targetRoom,
      recruitWhenEnded: this.recruitWhenEnded
    };
  }

  scheduleCreeps(list: string[]): void {
    if (!this.manager) {
      return;
    }
    for (let i = 0; i < list.length; i++) {
      this.manager.scheduleCreepIfNotInQueue(list[i], {
        groupHash: this.hash
      });
    }
  }

  activeRun(): void {
    // send cengineer first
    let cengineer: Creep | null = null;
    this.creeps.forEach(creep => {
      if (creep.memory.role != "cengineer") {
        return;
      }
      cengineer = creep;
      if (creep.room.name != this.targetRoom) {
        if (creep.hits == creep.hitsMax) {
          // Full health
          creep.travelTo(new RoomPosition(25, 25, this.targetRoom));
        }
      } else {
        // If nearly dead
        if (creep.hits <= creep.hitsMax / 3 && this.manager) {
          this.log("Creeps low health - retreating");
          creep.travelTo(new RoomPosition(25, 25, this.manager.room.name));
          return;
        }

        if (!creep.memory.targetId) {
          // no target
          const structureList = cengineer.room
            .find(FIND_HOSTILE_STRUCTURES)
            .filter(structure => {
              if (structure.structureType != STRUCTURE_SPAWN) {
                return false;
              }
              return true;
            })
            .map(structure => {
              return { pos: structure.pos, range: 1 };
            });

          const path = PathFinder.search(cengineer.pos, structureList, {
            roomCallback: roomName => {
              const room = Game.rooms[roomName];
              if (!room) {
                return false;
              }
              const costs = new PathFinder.CostMatrix();

              room.find(FIND_STRUCTURES).forEach(structure => {
                if (structure.pos) {
                  console.log(structure.pos);
                  costs.set(structure.pos.x, structure.pos.y, 10);
                }
              });
              return costs;
            }
          });

          path.path.forEach(element => {
            new RoomVisual(creep.room.name).circle(element.x, element.y, { fill: "blue" });
          });

          if (path.path.length > 0) {
            const lookResult = path.path[0].lookFor(LOOK_STRUCTURES);
            if (lookResult.length > 0) {
              const result = creep.dismantle(lookResult[0]);
              console.log(result);
            } else {
              creep.moveTo(path.path[0]);
            }
          }
        }

        if (creep.memory.targetId) {
          const target = Game.getObjectById(creep.memory.targetId);
          if (!target) {
            creep.memory.targetId = null;
            return;
          }
        }
      }
    });
    // send medic second
    this.creeps.forEach(creep => {
      if (creep.memory.role == "cmedic" && cengineer) {
        creep.travelTo(cengineer.pos, { range: 1 });
        if (cengineer && cengineer.hits < cengineer.hitsMax) {
          creep.rangedHeal(cengineer);
        }
      }
    });
  }

  static buildFromMemory(memoryRecord: ManagerMemoryGroup): GroupDismantle | false {
    const targetRoom = memoryRecord.targetRoom;
    if (!targetRoom || !memoryRecord.stage) {
      return false;
    }

    return new GroupDismantle(memoryRecord.stage, targetRoom, memoryRecord.recruitWhenEnded ?? false);
  }
}
