import { Vehicle } from '../../models/vehicle';
import { Position } from '../../models/Position';

interface TaxiArgs {
    id: string;
    position: Position;
    capacity: number;
}

class Taxi extends Vehicle {
    constructor({ id, position, capacity }: TaxiArgs) {
        super(id, position, capacity);
    }

    calculateFare(distance: number): number {
        return distance * 1.5;
    }
}

export { Taxi };
