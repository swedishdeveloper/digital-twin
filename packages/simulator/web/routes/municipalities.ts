import { pipe } from 'rxjs';
import { scan } from 'rxjs/operators';

const count = (): any => pipe(scan((acc: number) => acc + 1, 0));

export { count };
