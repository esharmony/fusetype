export type FuseTypeState<T extends {}, S> = T & {
  register: (fn:(state: S, prevState: S) => void, id: string) => void;
  remove: (id: string) => void;
  state: any;
  getLatestState: () => void;
  clearState: () => void;
};

export type Update<T> = (state: T, prevState: T) => void;

export interface State {
  state: object;
}
