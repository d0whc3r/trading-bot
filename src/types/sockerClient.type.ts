export type BasicSocketResponse = {
  e: string;
  [key: string]: string;
};

export type SocketCallback = (params: any) => void;
