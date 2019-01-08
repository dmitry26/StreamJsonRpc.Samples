import * as Rx from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { takeWhile, share, distinctUntilChanged, switchMap, retryWhen, tap } from 'rxjs/operators';

export enum WebSocketStatus {
  Connecting = WebSocket.CONNECTING,
  Opened = WebSocket.OPEN,
  Closing = WebSocket.CLOSING,
  Closed = WebSocket.CLOSED,
};

export interface JsonRpcRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: number[];
}

export class JsonRpcClient {
  private url = 'ws://localhost:' + window.location.port + '/Home/Socket';
  private socketConfig: WebSocketSubjectConfig<any>;
  public socketStatus$: Rx.Observable<WebSocketStatus>;
  private _socketStatusSrc: Rx.Subject<WebSocketStatus>;
  private connectMonit: Rx.Subscription;

  private socket$: WebSocketSubject<any>;
  private messenger: Rx.Observer<any>;

  private reconnectInterval = 1000;   // pause between connections
  private reconnectAttempts = Infinity;     // number of connection attempts

  constructor() {

    /// config for WebSocketSubject
    this.socketConfig = {
      url: this.url,
      closeObserver: {
        next: (e: CloseEvent) => {
          console.log(`webSocket closed: ${this.ts()}`);
          this._socketStatusSrc.next(WebSocketStatus.Closed);
        }
      },
      openObserver: {
        next: (e: Event) => {
          console.log(`webSocket opened: ${this.ts()}`);
          this._socketStatusSrc.next(WebSocketStatus.Opened);
        }
      },
      closingObserver: {
        next: () => {
          this._socketStatusSrc.next(WebSocketStatus.Closing);
        }
      }
    };

    this._socketStatusSrc = new Rx.Subject<WebSocketStatus>();
    this.socketStatus$ = this._socketStatusSrc.pipe(share(), distinctUntilChanged());
  }

  private ts = () => new Date().toLocaleTimeString();

  public connect(): void {

    if (this.socket$) {
      return;
    }

    this._socketStatusSrc.next(WebSocketStatus.Connecting);
    console.log(`Connecting (before subscribe): ${this.ts()}`);

    this.socket$ = new WebSocketSubject(this.socketConfig);

    this.socket$.pipe(
      tap((x) => console.log(`after merge: ${x}, ${this.ts()}`)),
      retryWhen((errs) =>
        errs.pipe(
          tap((err) => {
            const ws = <WebSocket>err.target;

            if (ws) {
              const { url, protocol, readyState } = ws;

              if (readyState !== WebSocketStatus.Closed) {
                console.error(
                  `WebSocket connection to '${url}' failed: protocol = ${protocol}, readyState = ${WebSocketStatus[readyState]}`
                );
              }
            } else { console.error(err); }
          }),
          takeWhile((_, idx) => idx < this.reconnectAttempts),
          switchMap((_, idx) => {
            console.log(`Connecting: dueTo = ${this.reconnectInterval * idx}, ${new Date().toLocaleTimeString()}`);
            return Rx.timer(this.reconnectInterval * idx).pipe(
              tap(() => console.log(`Connecting, after pause: ${new Date().toLocaleTimeString()}`)),
              tap(() => this._socketStatusSrc.next(WebSocketStatus.Connecting)),
            );
          }))
      )
    ).subscribe(
      data => {
        console.log(data);
        if (this.messenger) {
          this.messenger.next(data);
        }
      },
      (error: Event) => {
        const ws = <WebSocket>error.target;

        if (ws) {
          const { url, protocol, readyState } = ws;
          console.error(`WebSocket connection to '${url}' failed: protocol = ${protocol}, readyState = ${WebSocketStatus[readyState]}`);
        } else { console.error(error); }
      },
      () => console.warn('Completed!')
    );
  }

  getResponses(): Rx.Observable<any> {
    return new Rx.Observable<any>(observer => {
      this.messenger = observer;
    });
  }

  send = (req: JsonRpcRequest) => {
    this.socket$.next(req);
  }

  close = () => {
    if (this.socket$) {
      this.socket$.complete();
    }
  }

  error = (code: number, reason: string) => {
    if (this.socket$) {
      this.socket$.error({ code: code, reason: reason });
    }
  }
}
