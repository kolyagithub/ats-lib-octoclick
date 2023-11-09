export interface IDataStatsTableWhere {
  field: string;
  operator: string;
  value: number[];
}
export interface IRequestStatsTable {
  date_from: string;
  date_to: string;
  metrics: string[];
  where: IDataStatsTableWhere[] | undefined;
  group_by: string[] | undefined;
  user_occupation: number;
  datetime_range: string;
}