import { Manager } from "manager";
import { BuildTask } from "task.build";
import { Task } from "task";

interface SupplyPosition {
  pos: RoomPosition;
  energy: number;
}

export class SupplyTask extends Task {
  type: string;
  roles: string[];
  hash: number;
  target: StructureContainer;
  site: ConstructionSite;
  stagingPos: RoomPosition;
  amount: number;

  static COVERAGE_RANGE = 3;

  static buildFromMemory(memoryRecord: ManagerMemoryTask): SupplyTask | false {
    if (!memoryRecord.target || !memoryRecord.siteId || !memoryRecord.stagingPos || memoryRecord.amount === undefined) {
      return false;
    }
    const target = Game.getObjectById(memoryRecord.target) as StructureContainer | null;
    const site = Game.getObjectById(memoryRecord.siteId);
    if (!target || !site) {
      return false;
    }
    const { x, y, roomName } = memoryRecord.stagingPos;
    const stagingPos = new RoomPosition(x, y, roomName);
    return new SupplyTask(target, site, stagingPos, memoryRecord.amount);
  }

  constructor(target: StructureContainer, site: ConstructionSite, stagingPos: RoomPosition, amount: number) {
    super();
    this.type = "supply";
    this.roles = ["hauler"];
    this.hash = String("supply" + target.id + site.id).hashCode();
    this.target = target;
    this.site = site;
    this.stagingPos = stagingPos;
    this.amount = amount;
  }

  static getActiveSupplyPositions(manager: Manager): SupplyPosition[] {
    const positions: SupplyPosition[] = [];
    Object.values(Game.creeps).forEach(creep => {
      if (creep.memory.role !== "hauler" || !creep.memory.taskHash) {
        return;
      }
      const task = manager.taskManager.tasks[creep.memory.taskHash];
      if (!task || task.type !== "supply") {
        return;
      }
      const energy = creep.store.getUsedCapacity(RESOURCE_ENERGY);
      if (energy > 100) {
        positions.push({ pos: creep.pos, energy });
      }
    });
    return positions;
  }

  static isAreaCovered(sitePos: RoomPosition, covered: SupplyPosition[], range = SupplyTask.COVERAGE_RANGE): boolean {
    return covered.some(
      area => area.pos.roomName === sitePos.roomName && area.pos.getRangeTo(sitePos) <= range
    );
  }

  static measureNeedAtSite(site: ConstructionSite, manager: Manager): number {
    let need = Math.max(100, (site.progressTotal - site.progress) / 10);
    Object.values(manager.creeps).forEach(creep => {
      if (creep.memory.role !== "builder" || !creep.memory.taskHash) {
        return;
      }
      const task = manager.taskManager.tasks[creep.memory.taskHash];
      if (!task || task.type !== "build") {
        return;
      }
      const buildTask = task as BuildTask;
      if (buildTask.target.id !== site.id) {
        return;
      }
      need += creep.store.getFreeCapacity(RESOURCE_ENERGY);
      if (creep.memory.emptying) {
        need += 50;
      }
    });
    return need;
  }

  static pickBestSite(
    container: StructureContainer,
    sites: ConstructionSite[],
    covered: SupplyPosition[],
    manager: Manager
  ): ConstructionSite | null {
    let bestSite: ConstructionSite | null = null;
    let bestScore = -1;

    for (const site of sites) {
      if (SupplyTask.isAreaCovered(site.pos, covered)) {
        continue;
      }
      const stagingPos = SupplyTask.findStagingPos(site);
      if (!stagingPos) {
        continue;
      }
      const need = SupplyTask.measureNeedAtSite(site, manager);
      const score = need / (container.pos.getRangeTo(site.pos) + 1);
      if (score > bestScore) {
        bestScore = score;
        bestSite = site;
      }
    }

    return bestSite;
  }

  static findStagingPos(site: ConstructionSite): RoomPosition | null {
    const room = Game.rooms[site.pos.roomName];
    if (!room) {
      return null;
    }

    let best: RoomPosition | null = null;
    let bestScore = -1;

    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        if (dx === 0 && dy === 0) {
          continue;
        }
        const x = site.pos.x + dx;
        const y = site.pos.y + dy;
        if (x < 0 || x > 49 || y < 0 || y > 49) {
          continue;
        }
        const terrain = room.getTerrain().get(x, y);
        if (terrain === TERRAIN_MASK_WALL) {
          continue;
        }
        const structures = room.lookForAt(LOOK_STRUCTURES, x, y);
        let blocked = false;
        let hasRoad = false;
        for (const struct of structures) {
          if (
            struct.structureType !== STRUCTURE_ROAD &&
            struct.structureType !== STRUCTURE_CONTAINER &&
            (struct.structureType !== STRUCTURE_RAMPART || !struct.my)
          ) {
            blocked = true;
            break;
          }
          if (struct.structureType === STRUCTURE_ROAD) {
            hasRoad = true;
          }
        }
        if (blocked) {
          continue;
        }
        const range = site.pos.getRangeTo(x, y);
        const score = (hasRoad ? 10 : 0) + (3 - range);
        if (score > bestScore) {
          bestScore = score;
          best = new RoomPosition(x, y, site.pos.roomName);
        }
      }
    }

    return best;
  }

  storageData(): ManagerMemoryTask {
    return {
      hash: this.hash,
      type: this.type,
      target: this.target.id,
      siteId: this.site.id,
      stagingPos: {
        x: this.stagingPos.x,
        y: this.stagingPos.y,
        roomName: this.stagingPos.roomName
      },
      amount: this.amount
    };
  }

  run(creep: Creep): void {
    if (creep.memory.emptying && creep.store.getUsedCapacity() === 0) {
      creep.memory.emptying = false;
    } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
      creep.memory.emptying = true;
    } else if (
      creep.memory.emptying &&
      this.target.store.getUsedCapacity(RESOURCE_ENERGY) <= 0 &&
      creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0
    ) {
      // container drained but creep still has energy — go stage
    } else if (
      !creep.memory.emptying &&
      this.target.store.getUsedCapacity(RESOURCE_ENERGY) <= 0 &&
      creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0
    ) {
      creep.memory.emptying = true;
    }

    if (!creep.memory.emptying) {
      if (this.target.pos.roomName !== creep.room.name) {
        creep.travelTo(this.target.pos);
      } else {
        const pickup = creep.withdraw(this.target, RESOURCE_ENERGY);
        if (pickup === ERR_NOT_IN_RANGE) {
          creep.travelTo(this.target);
        }
      }
    } else if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
      if (!creep.pos.isEqualTo(this.stagingPos)) {
        creep.travelTo(this.stagingPos);
      }
    }
  }

  isValid(): boolean {
    if (!this.site) {
      return false;
    }
    if (this.amount <= 0) {
      return false;
    }

    let assignedEnergy = 0;
    let hasAssigned = false;
    Object.values(Game.creeps).forEach(creep => {
      if (creep.memory.taskHash === this.hash) {
        hasAssigned = true;
        assignedEnergy += creep.store.getUsedCapacity(RESOURCE_ENERGY);
      }
    });

    if (assignedEnergy > 0) {
      return true;
    }

    const containerEnergy = this.target ? this.target.store.getUsedCapacity(RESOURCE_ENERGY) : 0;
    if (!hasAssigned && containerEnergy > 0) {
      return true;
    }

    return false;
  }

  canCreepHaveThisTask(creep: Creep): boolean {
    return super.canCreepHaveThisTask(creep);
  }
}
