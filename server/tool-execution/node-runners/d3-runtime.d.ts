declare module 'd3' {
  export interface ScaleBand<Domain extends string> {
    (value: Domain): number | undefined
    domain(values: Iterable<Domain>): ScaleBand<Domain>
    range(values: readonly [number, number]): ScaleBand<Domain>
    padding(value: number): ScaleBand<Domain>
    bandwidth(): number
  }

  export interface ScaleLinear {
    (value: number): number
    domain(values: readonly [number, number]): ScaleLinear
    range(values: readonly [number, number]): ScaleLinear
    nice(count?: number): ScaleLinear
    ticks(count?: number): number[]
  }

  export interface LineGenerator<Datum> {
    (values: Iterable<Datum>): string | null
    x(accessor: (value: Datum) => number): LineGenerator<Datum>
    y(accessor: (value: Datum) => number): LineGenerator<Datum>
  }

  export function scaleBand<Domain extends string>(): ScaleBand<Domain>
  export function scaleLinear(): ScaleLinear
  export function line<Datum>(): LineGenerator<Datum>
  export function max<T>(values: Iterable<T>, accessor: (value: T) => number): number | undefined
  export function format(specifier: string): (value: number) => string
}
