var Task = require('task');
class RepairTask extends Task {
    constructor(target) {
        super()
        this.type = 'repair';
        this.roles = ['builder'];
        if (target.hash) {
            this.buildFromMemory(target);
        } else {
            this.target = target;
            this.hash = String("repair" + target.id).hashCode();
        }
    }
    buildFromMemory(memoryRecord) {
        this.target = Game.getObjectById(memoryRecord.target);
        this.hash = memoryRecord.hash;
    }
    run(creep) {
        if (creep.memory.emptying && creep.store.getUsedCapacity() == 0) {
            creep.memory.emptying = false;
        } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
            creep.memory.emptying = true;
        }

        if (creep.memory.emptying) {
            let target = this.target;

            if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                creep.moveToPos(target);
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

module.exports = RepairTask;
