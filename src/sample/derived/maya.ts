import { mod } from '../../number'
import { マヤツォルキン, マヤハアブ } from '../locale'

const マヤ長期暦13バクトゥン = 13 * 144000
let baseAt: number | undefined
let resolveBaseAt: (() => number) | undefined

export function setMayaLongCountBase(utc: number | (() => number)) {
  if ('function' === typeof utc) {
    resolveBaseAt = utc
    baseAt = undefined
  } else {
    baseAt = utc
  }
}

function mayaBaseAt() {
  return (baseAt ??= resolveBaseAt?.() ?? 0)
}

function mayaKin(utc: number) {
  return Math.floor((utc - mayaBaseAt()) / 86400000) + マヤ長期暦13バクトゥン
}

export function mayaLongCount(utc: number) {
  let kin = mayaKin(utc)
  const baktun = Math.floor(kin / 144000)
  kin -= baktun * 144000
  const katun = Math.floor(kin / 7200)
  kin -= katun * 7200
  const tun = Math.floor(kin / 360)
  kin -= tun * 360
  const uinal = Math.floor(kin / 20)
  kin -= uinal * 20
  return `${baktun}.${katun}.${tun}.${uinal}.${kin}`
}

export function mayaTzolkin(utc: number) {
  const kin = mayaKin(utc)
  const number = mod(kin + 3, 13) + 1
  const name = マヤツォルキン[mod(kin + 19, 20)]
  return `${number} ${name}`
}

export function mayaHaab(utc: number) {
  const kin = mayaKin(utc)
  const dayOfYear = mod(kin + 348, 365)
  const monthIndex = Math.floor(dayOfYear / 20)
  const day = dayOfYear - monthIndex * 20
  const name = マヤハアブ[monthIndex]
  return `${day} ${name}`
}
