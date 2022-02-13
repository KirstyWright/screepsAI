export class RoleUpgrader {
    static run(creep: Creep) {
        if (creep.memory.emptying && creep.store.getUsedCapacity() == 0) {
            creep.memory.emptying = false;
        } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
            creep.memory.emptying = true;
        }

        if (creep.memory.emptying) {

            if (creep.room != creep.manager.room) {
                creep.travelTo(creep.manager.room.controller);
                return;
            }

            if (!creep.room.controller) {
                return;
            }

            if (creep.room.controller && creep.room.controller && creep.room.controller.sign && creep.room.controller.sign.username != "PrincessVamps") {
                if (creep.signController(creep.room.controller, "Knock knock ...") == ERR_NOT_IN_RANGE) {
                    creep.travelTo(creep.room.controller);
                }
                return;
            }


            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.travelTo(creep.room.controller);
            }

        } else {
            creep.getEnergy(true, false);
        }
    }
};
