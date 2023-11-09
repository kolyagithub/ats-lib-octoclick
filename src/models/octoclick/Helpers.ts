export class Helpers {
  
  static str2num(str: string): number {
    const num = Number(str);
    return isNaN(num) ? 0 : num;
  }
  
}
