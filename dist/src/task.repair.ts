import { Task } from "task";
export class RepairTask extends Task {
    type: string;
    roles: string[];
    hash: number;
    target: Structure;

    static buildFromMemory(memoryRecord: Record<string, any>) {

        let target = <Structure | null>Game.getObjectById(memoryRecord.target);
        if (!target) {
            return false;
        }

        return new RepairTask(
            target
        );
    }

    constructor(target: Structure) {
        super()
        this.type = 'repair';
        this.roles = ['builder'];
        this.target = target;
        this.hash = String("repair" + target.id).hashCode();
    }

    storageData(): Record<string, any> {
        return {
            hash: this.hash,
            type: this.type,
            target: (this.target ? this.target.id : null)
        }
    }
    run(creep: Creep) {
        if (creep.memory.emptying && creep.store.getUsedCapacity() == 0) {
            creep.memory.emptying = false;
        } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
            creep.memory.emptying = true;
        }

        if (creep.memory.emptying) {
            let target = this.target;

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
        if (this.target.hits < this.target.hitsMax) {
            return true;
        }
        return false;
    }
}
