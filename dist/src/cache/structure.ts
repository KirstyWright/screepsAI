export class CachedStructure {
    pos: RoomPosition;
    id: Id<Structure>
    structureType: string


    constructor(structure: Structure) {
        this.pos = structure.pos;
        this.id = structure.id;
        this.structureType = structure.structureType;
    }

    storageData() {

    }

    static buildFromMemory(memoryRecord: Record<string, any>) {

        let target = memoryRecord.target;
        if (!target) {
            return false;
        }

        return new CachedStructure(
            target
        );
    }

}
