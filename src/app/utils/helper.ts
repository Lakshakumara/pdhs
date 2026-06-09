import { throwError } from "rxjs";

export class Helper {
    public handleError(error: any) {
        console.error('An error occurred:', error);
        return throwError(() => new Error(error.message || error));
    }

}