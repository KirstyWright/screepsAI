Creep.prototype.run = function() {
    // In prototype functions, 'this' usually has the value of the object calling
    // the function. In this case that is whatever this you are
    // calling '.sayHello()' on.
    if(this.carry.energy < this.carryCapacity) {
        var sources = this.room.find(FIND_SOURCES);
        if(this.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
            this.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    }
    else {
        var targets = this.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                structure.energy < structure.energyCapacity;
            }
        });
        if(targets.length > 0) {
            if(this.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    }
};
