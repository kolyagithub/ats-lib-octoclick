interface IResponseMeta {
  pagination: any;
  status: boolean;
  code: number;
}
export interface IResponse<T> {
  meta: IResponseMeta;
  data: T;
}