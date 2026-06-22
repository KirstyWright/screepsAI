export class CachedCreep {
    id: Id<Creep>


    constructor(creep: Creep) {
        this.id = creep.id;
    }

    storageData() {

    }

    static buildFromMemory(memoryRecord: Record<string, any>) {

        let target = memoryRecord.target;
        if (!target) {
            return false;
        }

        return new CachedCreep(
            target
        );
    }

}
