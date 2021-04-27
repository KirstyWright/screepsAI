import { Task } from "task";
export class CollectTask extends Task {
    type: string;
    roles: string[];
    hash: number;
    origin: Structure | Resource
    destination: Structure
    amount: number;


    static buildFromMemory(memoryRecord: Record<string, any>) {

        let origin = <Structure | Resource | null>Game.getObjectById(memoryRecord.origin);
        let destination = <Structure | null>Game.getObjectById(memoryRecord.destination);

        if (!origin || !destination) {
            return false;
        }

        return new CollectTask(
            origin,
            destination,
            memoryRecord.amount
        );
    }


    constructor(origin: Structure | Resource, destination: Structure, amount: number) {
        super()
        this.type = 'collect';
        this.roles = ['hauler'];

        this.hash = String("collect" + origin.id + destination.id).hashCode();
        this.origin = origin; // StructureContainer, StructureStorage, Resource
        this.destination = destination; // StructureContainer, StructureStorage
        this.amount = amount;
    }
    storageData(): Record<string, any> {
        return {
            hash: this.hash,
            type: this.type,
            origin: (this.origin ? this.origin.id : null),
            destination: (this.destination ? this.destination.id : null),
            amount: this.amount
        }
    }
    run(creep: Creep) {
        if (creep.memory.emptying && creep.store.getUsedCapacity() == 0) {
            creep.memory.emptying = false;
        } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
            creep.memory.emptying = true;
        }
        // } else if (!creep.memory.emptying && creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 100 && !this.origin) {
        //     creep.memory.emptying = true;
        // }
        if (!creep.memory.emptying) {
            if (this.origin.pos.roomName !== creep.room.name) {
                creep.moveToPos(this.origin.pos, {
                    visualizePathStyle: {
                        stroke: '#00FF00'
                    }
                });
            } else {
                let pickup;
                if ("structureType" in this.origin) {
                    pickup = creep.withdraw(this.origin, RESOURCE_ENERGY);
                } else {
                    pickup = creep.pickup(this.origin);
                }
                if (pickup == ERR_NOT_IN_RANGE) {
                    creep.moveToPos(this.origin, {
                        visualizePathStyle: {
                            stroke: '#00FF00'
                        }
                    });
                }

            }
        } else {
            if (creep.transfer(this.destination, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveToPos(this.destination, {
                    visualizePathStyle: {
                        stroke: '#ffffff'
                    }
                });
            }
        }
    }
    isValid() {
        if (this.origin == undefined || this.origin == null) {
            return false;
        }
        if (this.destination == undefined || this.destination == null) {
            return false;
        }
        if (this.amount <= 0) {
            return false;
        }
        return true;
    }
}


// module.exports = CollectTask;
