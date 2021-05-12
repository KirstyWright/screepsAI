import { Task } from "task";
export class BuildTask extends Task {
    type: string;
    roles: string[];
    hash: number;
    target: ConstructionSite;

    static buildFromMemory(memoryRecord: Record<string, any>) {

        let target = <ConstructionSite | null>Game.getObjectById(memoryRecord.target);
        if (!target) {
            return false;
        }

        return new BuildTask(
            target
        );
    }

    constructor(target :ConstructionSite) {
        super()
        this.type = 'build';
        this.roles = ['builder'];

        this.target = target;
        this.hash = String("build" + target.id).hashCode();

    }
    storageData(): Record<string, any> {
        return {
            hash: this.hash,
            type: this.type,
            target: (this.target ? this.target.id : null)
        }
    }
    run(creep: Creep) {
        if (!this.target) {
            return;
        }
        if (creep.memory.emptying && creep.store.getUsedCapacity() == 0) {
            creep.memory.emptying = false;
        } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
            creep.memory.emptying = true;
        }

        if (creep.memory.emptying) {
            let target = this.target;

            if (creep.build(target) == ERR_NOT_IN_RANGE) {
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
        return true;
    }
}

// module.exports = BuildTask;
