var roleHarvester = {

    /** @param {Creep} creep **/
    findSpot: function(creep) {
        for (var spot in Memory.mining.spots) {
            if (Memory.mining.spots[spot].harvesters.length < 2) {
                // Can mine here
                Memory.mining.spots[spot].harvesters.push(creep.id);
                creep.memory.assignment = spot;
                creep.say('Mining @ '+spot);
                return true;
            }
        }
    },
    run: function(creep) {
        if (creep.memory.assignment) {
            // has assignment
            let source = _.filter(Game.spawns['Spawn'].room.find(FIND_SOURCES), (source) => source.id == creep.memory.assignment)[0];
            if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        } else {
            // needs assignment
            this.findSpot(creep);
        }
	}
};

module.exports = roleHarvester;
