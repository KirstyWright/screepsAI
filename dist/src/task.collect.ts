import { Task } from "task";
export class CollectTask extends Task {
    type: string;
    roles: string[];
    hash: number;
    target: Structure | Resource | Tombstone | Ruin
    destination: Structure
    amount: number;


    static buildFromMemory(memoryRecord: Record<string, any>) {

        let target = <Structure | Tombstone | Resource | Ruin>Game.getObjectById(memoryRecord.target);
        let destination = <Structure | null>Game.getObjectById(memoryRecord.destination);

        if (!target || !target.id || !destination) {
            return false;
        }

        let task = new CollectTask(
            target,
            destination,
            memoryRecord.amount
        );
        return task;
    }


    constructor(target: Structure | Tombstone | Ruin | Resource, destination: Structure, amount: number) {
        super()
        this.type = 'collect';
        this.roles = ['hauler'];

        this.hash = String("collect" + target.id + destination.id).hashCode();
        this.target = target; // StructureContainer, StructureStorage, Resource
        this.destination = destination; // StructureContainer, StructureStorage
        this.amount = amount;


        // if (this.target && this.target.pos) {
        //     new RoomVisual(this.target.pos.roomName).text(this.hash + ' target', this.target.pos.x, this.target.pos.y, { align: 'left', color: 'white', font: 0.2 });
        // }
        // if (this.destination && this.destination.pos) {
        //     new RoomVisual(this.destination.pos.roomName).text(this.hash + ' Destination', this.destination.pos.x, this.destination.pos.y, { align: 'left', color: 'white', font: 0.2 });
        // }

    }
    storageData(): Record<string, any> {
        return {
            hash: this.hash,
            type: this.type,
            target: (this.target ? this.target.id : null),
            destination: (this.destination ? this.destination.id : null),
            amount: this.amount
        }
    }
    run(creep: Creep): void {
        if (creep.memory.emptying && creep.store.getUsedCapacity() == 0) {
            creep.memory.emptying = false;
        } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
            creep.memory.emptying = true;
        }
        // } else if (!creep.memory.emptying && creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 100 && !this.target) {
        //     creep.memory.emptying = true;
        // }
        if (!creep.memory.emptying) {
            if (this.target.pos.roomName !== creep.room.name) {
                creep.travelTo(this.target.pos);
            } else {

                let pickup;
                if ("store" in this.target) {
                    pickup = creep.withdraw(this.target, RESOURCE_ENERGY);
                } else if ('amount' in this.target) {
                    pickup = creep.pickup(this.target);
                } else {
                    return; // Should never get here as should be picked up by isValid
                }
                if (pickup == ERR_NOT_IN_RANGE) {
                    creep.travelTo(this.target);
                }
            }
        } else {
            let result = creep.transfer(this.destination, RESOURCE_ENERGY);
            if (result == ERR_NOT_IN_RANGE) {
                creep.travelTo(this.destination);
            }
        }
    }
    isValid(): boolean {
        if ((this.target == undefined || this.target == null) && this.amount >= 0) {
            return false;
            // If cannot find target and need to transfer more resources
        }
        if (this.destination == undefined || this.destination == null) {
            return false;
        }
        if (this.amount <= 0) {
            return false;
        }
        if (!("store" in this.target) && "structureType" in this.target) {
            return false;  // If it has no storage but is a structure we cannot withdraw from it
        }

        if (
            (<StructureContainer | Ruin | Tombstone>this.target).store !== undefined
            && (<StructureContainer | Ruin | Tombstone>this.target).store.getUsedCapacity(RESOURCE_ENERGY) <= 0
        ) {
            // If structure has a store (ie is a structure) && has no energy in it
            return false;
        }

        if (
            (<StructureContainer | Ruin | Tombstone>this.destination).store !== undefined
            && (<StructureContainer | Ruin | Tombstone>this.destination).store.getFreeCapacity(RESOURCE_ENERGY) == 0
        ) {
            // If structure has a store (ie is a structure) && is full
            return false;
        }

        return true;
    }
    canCreepHaveThisTask(creep: Creep): boolean {

        if (!this.roles.includes(creep.memory.role)) {
            return false;
        }
        let number = 0;
        Object.values(Game.creeps).forEach(loopCreep => {
            if (loopCreep.memory.taskHash && loopCreep.memory.taskHash == this.hash) {
                number = number + (loopCreep.getActiveBodyparts(CARRY) * CARRY_CAPACITY);
            }
        });
        if ((this.amount - number) > 500) {
            // If there is more than 500 left over after all the current haulers are full then
            // assign a second hauler
            return true;
        }
        return false;
    }
}


// module.exports = CollectTask;
