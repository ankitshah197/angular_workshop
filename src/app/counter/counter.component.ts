import { Component, OnDestroy } from '@angular/core';
import { NEVER, Subject, Subscription, merge, interval } from 'rxjs';
import { mapTo, switchMap, scan } from 'rxjs/operators';

interface CounterState {
  isTicking: boolean;
  count: number;
  countUp: boolean;
  tickSpeed: number;
  countDiff: number;
  initialSetTo: number;
}

enum ElementIds {
  TimerDisplay = 'timer-display',
  BtnStart = 'btn-start',
  BtnPause = 'btn-pause',
  BtnUp = 'btn-up',
  BtnDown = 'btn-down',
  BtnReset = 'btn-reset',
  BtnSetTo = 'btn-set-to',
  InputSetTo = 'input-set-to',
  InputTickSpeed = 'input-tick-speed',
  InputCountDiff = 'input-count-diff',
}

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.scss'],
})
export class CounterComponent implements OnDestroy {
  elementIds = ElementIds;

  initialCounterState: CounterState = {
    isTicking: false,
    count: 0,
    countUp: true,
    tickSpeed: 200,
    countDiff: 1,
    initialSetTo: 10,
  };

  btnStart: Subject<Event> = new Subject<Event>();
  btnPause: Subject<Event> = new Subject<Event>();
  btnSetTo: Subject<Event> = new Subject<Event>();
  inputSetTo: Subject<Event> = new Subject<Event>();

  subscription: Subscription;

  constructor() {
    this.subscription = merge(
      this.btnStart.pipe(mapTo(true)),
      this.btnPause.pipe(mapTo(false))
    )
    .pipe(
        switchMap((isTicking) => {return isTicking  ? interval(this.initialCounterState.tickSpeed): NEVER; }),
        scan((conut: number, _) => ++conut)
      )
    .subscribe((n) => (this.initialCounterState.count = n));
  }

  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getInputValue = (event: HTMLInputElement): number => {
    return parseInt(event['target'].value, 10);
  };
}
