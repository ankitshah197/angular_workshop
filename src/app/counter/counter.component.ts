import { Component, OnDestroy } from '@angular/core';
import { NEVER, Subject, Subscription, merge, timer, Observable, combineLatest } from 'rxjs';
import { mapTo, switchMap, scan, withLatestFrom, tap, takeUntil, map, startWith, shareReplay } from 'rxjs/operators';
import { inputToValue } from '../operators/inputToValue';
import { CounterStateKeys } from '../counter-state-keys.enum';
import { selectDistinctState } from '../operators/selectDistinctState';
import { Command } from './command.interface';

//CONSTANTS **********

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
  ngOnDestroySubject = new Subject();
  elementIds = ElementIds;

  initialCounterState: CounterState = {
    isTicking: false,
    count: 0,
    countUp: true,
    tickSpeed: 200,
    countDiff: 1,
    initialSetTo: 10,
  };

  // BASE OBSERVABLES  **********
  // SOURCE OBSERVABLES **********
  
  // INTERACTION OBSERVABLES **********

  btnStart: Subject<Event> = new Subject<Event>();
  btnPause: Subject<Event> = new Subject<Event>();
  btnUp: Subject<Event> = new Subject<Event>();
  btnDown: Subject<Event> = new Subject<Event>();
  btnSetTo: Subject<Event> = new Subject<Event>();
  inputSetTo: Subject<any> = new Subject<any>();
  inputTickSpeed: Subject<Event> = new Subject<Event>();
  inputCountDiff: Subject<Event> = new Subject<Event>();
  btnReset: Subject<Event> = new Subject<Event>();

  // INTERMEDIATE OBSERVABLES **********
  lastSetToFromButtonClick = this.btnSetTo
    .pipe(withLatestFrom(this.inputSetTo.pipe(inputToValue()), (_, inputSetTo: number) => { return inputSetTo;})
  );

  // STATE OBSERVABLES **********
  programmaticCommandSubject: Subject<Command> = new Subject();
  counterCommands: Observable<Command> = merge(
    this.btnStart.pipe(mapTo({ isTicking: true })),
    this.btnPause.pipe(mapTo({ isTicking: false })),
    this.lastSetToFromButtonClick.pipe(map((n) => ({ count: n }))),
    this.btnUp.pipe(mapTo({ countUp: true })),
    this.btnDown.pipe(mapTo({ countUp: false })),
    this.btnReset.pipe(mapTo({ ...this.initialCounterState })),
    this.inputTickSpeed.pipe(inputToValue(),map((n) => ({ tickSpeed: n }))),
    this.inputCountDiff.pipe(inputToValue(),map((n) => ({ countDiff: n }))),
    this.programmaticCommandSubject.asObservable()
  );
  counterState: Observable<CounterState> = this.counterCommands.pipe(
    startWith(this.initialCounterState),
    scan(
      (counterState: CounterState, command): CounterState => ({...counterState,...command})
    ),
    shareReplay(1)
  )

  // SIDE EFFECTS **********
  isTicking = this.counterState.pipe(
    selectDistinctState<CounterState, boolean>(CounterStateKeys.isTicking)
  );
  tickSpeed = this.counterState.pipe(
    selectDistinctState<CounterState, boolean>(CounterStateKeys.tickSpeed)
  );
  intervalTick$ = combineLatest(this.isTicking, this.tickSpeed).pipe(
    switchMap(([isTicking, tickSpeed]) => {
      return isTicking ? timer(0, tickSpeed) : NEVER;
    })
  );
  
  // BACKGROUND PROCESSES **********
  updateCounterFromTick = this.intervalTick$.pipe(
    withLatestFrom(this.counterState, (_, s) => s),
    tap(({ count, countDiff, countUp }) => {
      const diff = countDiff * (countUp ? 1 : -1);
      this.programmaticCommandSubject.next({ count: count + diff });
    })
  );

  constructor() {
    merge(this.updateCounterFromTick)
    .pipe(takeUntil(this.ngOnDestroySubject.asObservable()))
    .subscribe();
  }

  ngOnDestroy(): void {
    this.ngOnDestroySubject.next(true);
  }

}
