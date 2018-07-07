var roleTransporter = {

    /** @param {Creep} creep **/
    run: function(creep)
    {
        let action = false;
        if (creep.memory.task) {
            let source = Game.getObjectById(creep.memory.task.sourceId);
            // console.log(creep.name+" - "+JSON.stringify(creep.memory.task));
            if (source === null || source.energy == 0) {
                // nothing left so task complete
                this.completeTask(creep);
                return;
            }
            if (creep.carry.energy < creep.carryCapacity) {
                if(creep.pickup(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#00FF00'}});
                }
                action = true;
            }
        }
        if (action === false && creep.carry.energy > 0) {
            // can still drop off if no task
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (
                            structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN ||
                            structure.structureType == STRUCTURE_TOWER ||
                            structure.structureType == STRUCTURE_CONTAINER
                        ) && structure.energy < structure.energyCapacity;
                    }
            });
            if(targets.length > 0) {
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#FF0000'}});
                }
            } else {
                if (creep.pos.x == 39 && creep.pos.y == 26){
                    creep.drop(RESOURCE_ENERGY);
                } else {
                    creep.moveTo(39,26, {visualizePathStyle: {stroke: '#FFFF00'}});
                }
            }
        } else if (action === false) {
            creep.moveTo(Game.spawns['Spawn']);
        }


    },
    getTask: function(creep)
    {
        let tasks = _.filter(Memory.transport.tasks, (task) => task.assignedToId == null);
        for (key in tasks) {
            creep.memory.task = Memory.transport.tasks[tasks[key].id];
            Memory.transport.tasks[tasks[key].id].assignedToId = creep.id
            creep.say('Got task '+tasks[key].id);
            break;
        }
    },
    completeTask: function(creep)
    {
        delete Memory.transport.tasks[creep.memory.task.id]
        creep.say('Completed task '+creep.memory.task.id);
        delete creep.memory.task;
    }
};

module.exports = roleTransporter;
