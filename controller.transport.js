/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('controller.mining');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    run: function()
    {
        if (!Memory.transport) {
            Memory.transport = {
                tasks:{},
                lastTaskId: 0
            }
            let transporters = _.filter(Game.creeps, (creep) => creep.memory.role == 'transporter');
            for (var id in transporters) {
                transporters[id].memory.task = null;
            }
        }
        let sources = Game.spawns['Spawn'].room.find(FIND_DROPPED_RESOURCES);
        let knownSources = [];
        for (key in sources) {
            if (sources[key].pos.x == 39 && sources[key].pos.y == 26) {
                continue; // no tasks for temp dumping spot
            }
            let flag = false;
            for (taskKey in Memory.transport.tasks) {
                if (Memory.transport.tasks[taskKey].sourceId === sources[key].id) {
                    // If we have a task for this Source then skip
                    flag = true;
                    break;
                }
            }
            // If we are here then we have no task for this Source.
            if (!flag) {
                this.makeJob('collect',sources[key]);
            }
        }

        for (var taskKey in Memory.transport.tasks) {

            let task = Memory.transport.tasks[taskKey];
            let source = Game.getObjectById(task.sourceId)
            if (!source && task.assignedToId === null) {
                delete Memory.transport.tasks[taskKey];
                console.log("Clearing task "+taskKey+' because no source');
            }
            if (task.assignedToId) {
                let creep = Game.getObjectById(task.assignedToId)
            }
            //clean up dead Creeps from active tasks
            if (task.assignedToId) {
                if (!Game.getObjectById(task.assignedToId)) {
                    // dead Creep
                    console.log("Clearing task "+taskKey+' from dead creep');
                    console.log(JSON.stringify(task));
                    // Memory.transport.tasks[taskKey].assignedToId = null;
                }
            }
            if (task.assignedToId === null) {
                let transporters = _.filter(Game.creeps, (creep) => (creep.memory.role == 'transporter' && creep.memory.task === null));
                for (var transporterId in transporters) {
                    if (transporters[transporterId].memory.task === null) {
                        // Give it a task
                        transporters[transporterId].memory.task = task;
                        transporters[transporterId].say("Got transport task: "+task.id);
                        Memory.transport.tasks[taskKey].assignedToId = transporters[transporterId].id;
                    }
                }
            }
        }
        // for (key in tasks) {
        //     creep.memory.task = Memory.transport.tasks[tasks[key].id];
        //     Memory.transport.tasks[tasks[key].id].assignedToId = creep.id
        //     creep.say('Got task '+tasks[key].id);
        //     break;
        // }
    },
    makeJob: function(type,source)
    {
        let taskId = Memory.transport.lastTaskId + 1;
        Memory.transport.lastTaskId = taskId;
        if (type == 'collect')
        {
            Memory.transport.tasks[taskId] = {
                id:taskId,
                type:'collect',
                sourceId:source.id,
                assignedToId:null
            };
        }
    }
};
