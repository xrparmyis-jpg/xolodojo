export interface IWalletHandler {
  connect(args: any): Promise<void>;
  disconnect(args: any): Promise<void>;
  repair?(args: any): Promise<void>;
  getLabel?(args: any): Promise<string | undefined>;
}
