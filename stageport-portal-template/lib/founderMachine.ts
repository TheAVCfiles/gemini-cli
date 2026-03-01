export const FounderStates = {
  IDLE: 'IDLE',
  BUILDING: 'BUILDING',
  THROTTLED: 'THROTTLED',
} as const;

export type FounderState = (typeof FounderStates)[keyof typeof FounderStates];

export function transition(state: FounderState, event: string): FounderState {
  if (event === 'RESET') return FounderStates.IDLE;

  if (state === FounderStates.IDLE && event === 'START_BUILD') {
    return FounderStates.BUILDING;
  }

  if (state === FounderStates.BUILDING && event === 'THROTTLE') {
    return FounderStates.THROTTLED;
  }

  return state;
}
