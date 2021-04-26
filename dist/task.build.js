var Task = require('task');
class BuildTask extends Task {
    constructor(target) {
        super()
        this.type = 'build';
        this.roles = ['builder'];
        if (target.hash) {
            this.buildFromMemory(target);
        } else {
            this.target = target;
            this.hash = String("build" + target.id).hashCode();
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

            if (creep.build(target) == ERR_NOT_IN_RANGE) {
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
        return true;
    }
}

module.exports = BuildTask;
