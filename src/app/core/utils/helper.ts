import { throwError } from "rxjs";

export class Helper {
    public handleError(error: any) {
        return throwError(() => new Error(error.message || error));
    }

}