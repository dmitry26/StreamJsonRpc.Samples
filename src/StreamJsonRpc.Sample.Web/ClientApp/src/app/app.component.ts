import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import * as Rx from 'rxjs';
import { JsonRpcClient, JsonRpcRequest, WebSocketStatus } from './jsonRpcClient';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'StreamJsonRpc';

  private reqId = 0;
  private rspSub: Rx.Subscription;
  private wsStatSub: Rx.Subscription;
  private jsonRpcClient = new JsonRpcClient();

  valueA: number;
  valueB: number;
  addRes: any = '?';
  socketStatus: string;
  msgStatus: string;

  constructor() {
  }

  ngOnInit() {
    this.wsStatSub = this.jsonRpcClient.socketStatus$.subscribe(stat => {
      this.socketStatus = WebSocketStatus[stat];
    });

    this.jsonRpcClient.connect();

    this.rspSub = this.jsonRpcClient.getResponses()
      .subscribe(rsp => {
        if (rsp.id === this.reqId) {
          if (rsp.result) {
            this.addRes = rsp.result;
          }
          this.msgStatus = `Message received: ${JSON.stringify(rsp)}`;
        }
      });
  }

  ngOnDestroy() {
    if (this.rspSub) {
      this.rspSub.unsubscribe();
    }

    if (this.wsStatSub) {
      this.wsStatSub.unsubscribe();
    }

    if (this.jsonRpcClient) {
      this.close();
    }
  }

  onCalc(): void {
    console.log(`valueA: ${this.valueA}, valueB = ${this.valueB}`);
    this.add(this.valueA, this.valueB);
  }

  isCalcBtnDisabled = () => {
    return !this.valueA || !this.valueB || this.addRes !== '?';
  }

  private add(a: number, b: number) {
    const req: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: ++this.reqId,
      method: 'Add',
      params: [
        a,
        b
      ]
    };

    this.jsonRpcClient.send(req);
  }

  onChangeValue($event: Event) {
    this.msgStatus = undefined;
    this.addRes = '?';
  }

  close(): void {
    this.jsonRpcClient.close();
  }
}
