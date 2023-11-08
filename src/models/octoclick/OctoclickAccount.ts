import { RESPONSE_CODES } from '../../consts';
import {
  IHttpResponse,
  Account,
  BalanceAccount,
  ResponceApiNetwork,
  StatsAccount, StatsRaw
} from "@atsorganization/ats-lib-ntwk-common";
import { IRequestStatsTable } from "./api/IRequestStatsTable";
import { StatisticMetricType, UserOccupationType } from "./api/Enums";
import ResponseStatsTableTotal, { IResultStatsTableTotalData } from "./api/ResponseStatsTableTotal";

export default class OctoclickAccount extends Account {
  /**
   * Получение баланса
   */
  async getBalance(): Promise<ResponceApiNetwork<BalanceAccount>> {
    const externalUrl = 'user/info/balance';
    const res = await this.conn.api_conn?.get(externalUrl).then((resp: IHttpResponse) => resp.data);
    const account = res?.data;
    
    const isValidBalance = account?.balance_total !== undefined && account?.balance_total !== null;
    const balance = isValidBalance ? String(account?.balance_total)?.replace('~', '') : undefined;
    
    if (isValidBalance) {
      this.setBalance(new BalanceAccount(Number(balance)));
    }
    
    return new ResponceApiNetwork({
      code: balance ? RESPONSE_CODES.SUCCESS : RESPONSE_CODES.INTERNAL_SERVER_ERROR,
      message: balance ? 'OK' : JSON.stringify(res),
      data: balance ? new BalanceAccount(Number(balance)) : undefined
    });
  }

  /**
   * Получить данные аккаунта из сети
   */
  fetch(): Promise<ResponceApiNetwork<Account>> {
    throw new Error('Method not implemented.');
  }

  /**
   * Статистика по аккаунту
   * @param dateFrom
   * @param dateTo
   */
  async stats(dateFrom: string, dateTo: string): Promise<ResponceApiNetwork<StatsAccount>> {
    dateFrom += " 00:00:00";
    dateTo += " 23:59:59";
    
    const externalUrl = `statistic/table-total`;
    
    const body: IRequestStatsTable = {
      date_from: dateFrom,
      date_to: dateTo,
      metrics: [StatisticMetricType.IMPRESSION, StatisticMetricType.ADVERTISER_SPENT],
      where: undefined,
      group_by: undefined,
      user_occupation: UserOccupationType.ADVERTISER,
      datetime_range: "day"
    }
    
    let statsData: ResponseStatsTableTotal | undefined;
    if (this.conn.api_conn) {
      const response = await this.conn.api_conn?.post(externalUrl, body, {
        'Content-Type': 'application/json'
      });
      statsData = new ResponseStatsTableTotal(response.data);
    }
    
    const dataStats: IResultStatsTableTotalData | undefined = statsData?.value.data;
    const data = new StatsAccount({
          report_date: dateFrom + ' - ' + dateTo,
          impressions: Number(dataStats?.metric.Impression),
          cost: Number(dataStats?.metric.AdvertiserSpent)
        }
    );
    
    return new ResponceApiNetwork({
      code: RESPONSE_CODES.SUCCESS,
      message: 'OK',
      data
    });
  }
  
}