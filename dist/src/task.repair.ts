import { Task } from "task";
export class RepairTask extends Task {
  type: string;
  roles: string[];
  hash: number;
  target: Structure;

  static buildFromMemory(memoryRecord: ManagerMemoryTask): RepairTask | false {
    if (!memoryRecord.target) {
      return false;
    }
    const target = Game.getObjectById(memoryRecord.target as Id<Structure>);
    if (!target) {
      return false;
    }

    return new RepairTask(target);
  }

  constructor(target: Structure) {
    super();
    this.type = "repair";
    this.roles = ["builder"];
    this.target = target;
    this.hash = String("repair" + target.id).hashCode();
  }

  storageData(): ManagerMemoryTask {
    return {
      hash: this.hash,
      type: this.type,
      target: this.target ? this.target.id : null
    };
  }
  run(creep: Creep) {
    if (creep.memory.emptying && creep.store.getUsedCapacity() == 0) {
      creep.memory.emptying = false;
    } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
      creep.memory.emptying = true;
    }

    if (creep.memory.emptying) {
      const target = this.target;

      if (creep.repair(target) == ERR_NOT_IN_RANGE) {
        creep.travelTo(target);
      }
    } else {
      creep.getEnergy(true, false);
    }
  }
  isValid() {
    if (this.target == undefined || this.target == null) {
      return false;
    }
    if (
      (this.target.structureType === STRUCTURE_WALL || this.target.structureType === STRUCTURE_RAMPART) &&
      this.manager &&
      this.target.hits >= this.manager.wallStrength
    ) {
      return false;
    }

    if (this.target.hits < this.target.hitsMax) {
      return true;
    }
    return false;
  }

  private getHitsTarget(): number {
    if (
      this.target.structureType === STRUCTURE_WALL ||
      this.target.structureType === STRUCTURE_RAMPART
    ) {
      return this.manager?.wallStrength ?? this.target.hitsMax;
    }
    return this.target.hitsMax;
  }

  getWorkRemaining(): number {
    return Math.max(0, this.getHitsTarget() - this.target.hits);
  }

  getWorkTotal(): number {
    return this.getWorkRemaining(); // Can't work out how big repair task is atm
  }
}
