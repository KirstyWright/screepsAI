import { Task } from "task";
export class CollectTask extends Task {
    type: string;
    roles: string[];
    hash: number;
    origin: Structure | Resource | Tombstone | Ruin
    destination: Structure
    amount: number;


    static buildFromMemory(memoryRecord: Record<string, any>) {

        let origin = <Structure | Tombstone | Resource | Ruin | null>Game.getObjectById(memoryRecord.origin);
        let destination = <Structure | null>Game.getObjectById(memoryRecord.destination);

        if (!origin || !origin.id || !destination) {
            return false;
        }

        let task = new CollectTask(
            origin,
            destination,
            memoryRecord.amount
        );
        return task;
    }


    constructor(origin: Structure | Tombstone | Ruin | Resource, destination: Structure, amount: number) {
        super()
        this.type = 'collect';
        this.roles = ['hauler'];

        this.hash = String("collect" + origin.id + destination.id).hashCode();
        this.origin = origin; // StructureContainer, StructureStorage, Resource
        this.destination = destination; // StructureContainer, StructureStorage
        this.amount = amount;


        // if (this.origin && this.origin.pos) {
        //     new RoomVisual(this.origin.pos.roomName).text(this.hash + ' Origin', this.origin.pos.x, this.origin.pos.y, { align: 'left', color: 'white', font: 0.2 });
        // }
        // if (this.destination && this.destination.pos) {
        //     new RoomVisual(this.destination.pos.roomName).text(this.hash + ' Destination', this.destination.pos.x, this.destination.pos.y, { align: 'left', color: 'white', font: 0.2 });
        // }

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
    run(creep: Creep): void {
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
                creep.travelTo(this.origin.pos);
            } else {

                let pickup;
                if ("store" in this.origin) {
                    pickup = creep.withdraw(this.origin, RESOURCE_ENERGY);
                } else if ('amount' in this.origin) {
                    pickup = creep.pickup(this.origin);
                } else {
                    return; // Should never get here as should be picked up by isValid
                }
                if (pickup == ERR_NOT_IN_RANGE) {
                    creep.travelTo(this.origin);
                }

                if (pickup === OK) {
                    creep.log("I am taking "+this.amount+" ("+creep.store.getCapacity()+") from "+this.origin.pos+" to take to "+this.destination.pos);
                }

            }
        } else {
            let result = creep.transfer(this.destination, RESOURCE_ENERGY);
            if (result == ERR_NOT_IN_RANGE) {
                creep.travelTo(this.destination);
            } else if (result == OK) {
                creep.log("I am giving "+this.amount+" ("+creep.store.getCapacity()+") to "+this.destination.pos+" from "+this.origin.pos);
            }
        }
    }
    isValid(): boolean {
        if ((this.origin == undefined || this.origin == null) && this.amount >= 0) {
            return false;
            // If cannot find origin and need to transfer more resources
        }
        if (this.destination == undefined || this.destination == null) {
            return false;
        }
        if (this.amount <= 0) {
            return false;
        }
        if (!("store" in this.origin) && "structureType" in this.origin) {
            return false;  // If it has no storage but is a structure we cannot withdraw from it
        }

        if (
            (<StructureContainer | Ruin | Tombstone>this.origin).store !== undefined
            && (<StructureContainer | Ruin | Tombstone>this.origin).store.getUsedCapacity(RESOURCE_ENERGY) <= 0
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
}


// module.exports = CollectTask;
