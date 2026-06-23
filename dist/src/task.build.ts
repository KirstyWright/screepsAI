import { Task } from "task";
export class BuildTask extends Task {
  type: string;
  roles: string[];
  hash: number;
  target: ConstructionSite;

  static buildFromMemory(memoryRecord: ManagerMemoryTask): BuildTask | false {
    if (!memoryRecord.target) {
      return false;
    }
    const target = Game.getObjectById(memoryRecord.target as Id<ConstructionSite>);
    if (!target) {
      return false;
    }

    return new BuildTask(target);
  }

  constructor(target: ConstructionSite) {
    super();
    this.type = "build";
    this.roles = ["builder"];

    this.target = target;
    this.hash = String("build" + target.id).hashCode();
  }
  storageData(): ManagerMemoryTask {
    return {
      hash: this.hash,
      type: this.type,
      target: this.target ? this.target.id : null
    };
  }
  run(creep: Creep) {
    if (!this.target) {
      return;
    }
    if (creep.memory.emptying && creep.store.getUsedCapacity() == 0) {
      creep.memory.emptying = false;
    } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
      creep.memory.emptying = true;
      creep.memory.targetId = null; // clear targetId so we can find a new one
    }

    if (creep.memory.emptying) {
      const target = this.target;

      if (creep.build(target) == ERR_NOT_IN_RANGE) {
        creep.travelTo(target);
      }
    } else {
      creep.getEnergy(true, false, undefined, this.target.pos);
    }
  }
  isValid() {
    if (this.target == undefined || this.target == null) {
      return false;
    }
    return true;
  }


  getWorkRemaining(): number {
    return this.target.progressTotal - this.target.progress;
  }

  getWorkTotal(): number {
    return this.target.progressTotal;
  }
}

// module.exports = BuildTask;
