/**
 * @typedef {'1m' | '5m' | '15m' | '1h' | '1d' | '1w' | '1M'} IntervalType
 */

/**
 * @typedef {Object} Candle
 * @property {number} time
 * @property {number} open
 * @property {number} high
 * @property {number} low
 * @property {number} close
 * @property {number} volume
 */

/**
 * @typedef {Object} IntervalData
 * @property {IntervalType} interval
 * @property {Candle[]} candles
 * @property {number|null} ltp
 * @property {number|null} previousClose
 * @property {number|null} priceChange
 * @property {number|null} percentChange
 * @property {{open:number, high:number, low:number, close:number}|undefined} [ohlc]
 */

/**
 * @typedef {Object.<string, IntervalData>} AllIntervalsData
 */

export const dummy = {}; // Export something so file is treated as a module
