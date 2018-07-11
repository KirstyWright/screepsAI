module.exports = {

    run: function(creep) {
        if (creep.memory.emptying && creep.carry.energy == 0) {
            creep.memory.emptying = false;
        }
        if (!creep.memory.emptying && creep.carry.energy == creep.carryCapacity) {
            creep.memory.emptying = true;
        }

        if (creep.memory.emptying) {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
            }
        } else {
            creep.getEnergy(true, true);
        }
    }
}