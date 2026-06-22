interface CachedStructureMemory {
  id: Id<Structure>;
}

export class CachedStructure {
  pos: RoomPosition;
  id: Id<Structure>;
  structureType: StructureConstant;

  constructor(structure: Structure) {
    this.pos = structure.pos;
    this.id = structure.id;
    this.structureType = structure.structureType;
  }

  storageData(): CachedStructureMemory {
    return { id: this.id };
  }

  static buildFromMemory(memoryRecord: CachedStructureMemory): CachedStructure | false {
    const structure = Game.getObjectById(memoryRecord.id);
    if (!structure) {
      return false;
    }

    return new CachedStructure(structure);
  }
}
