import { RESPONSE_CODES } from '../../consts';
import {
  IHttpResponse,
  Account,
  BalanceAccount,
  ResponceApiNetwork,
  StatsAccount
} from '@atsorganization/ats-lib-ntwk-common';

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
    throw new Error('Method not implemented.');
  }
}