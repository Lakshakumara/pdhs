import { throwError } from "rxjs";

export class Helper {
    public handleError(error: any) {
        return throwError(() => new Error(error.message || error));
    }

}
export function equalsIgnoreCase(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}