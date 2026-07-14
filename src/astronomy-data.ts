import type { BodyProfile } from './orbital-model'

// 2019/03/21 06:58 JST
export const MEAN_SEASON_EPOCH_MSEC = 1553119080000

export const MEAN_ASTRONOMY = {
  Sun: {
    body: { kind: 'physical', name: 'Sun', radiusKm: 695700 } as BodyProfile,
  },
  Mercury: {
    body: { kind: 'physical', name: 'Mercury', radiusKm: 2439.7 } as BodyProfile,
    orbital: [7596288000, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [15192576000, 0, 0.01] as const,
  },
  Venus: {
    body: { kind: 'physical', name: 'Venus', radiusKm: 6051.8 } as BodyProfile,
    orbital: [19414456423, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [10087251840, 0, -2.64] as const,
  },
  Earth: {
    body: { kind: 'physical', name: 'Earth', radiusKm: 6378.137 } as BodyProfile,
    orbital: [31556925147, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [86400000, 0, 23.4397] as const,
  },
  Moon: {
    body: {
      kind: 'physical',
      name: 'Moon',
      radiusKm: 1737.4,
      meanDistanceKm: 384400,
    } as BodyProfile,
    orbital: [2551442889, 1577310360000] as const,
    whiteOrbital: [2551442889, 1577310360000] as const,
    rotation: [2551442889, 0, 6.68] as const,
  },
  Mars: {
    body: { kind: 'physical', name: 'Mars', radiusKm: 3389.5 } as BodyProfile,
    orbital: [59355616881, Date.UTC(2018, 9, 28)] as const,
    rotation: [88740035, 0, 25.19] as const,
  },
  Jupiter: {
    body: { kind: 'physical', name: 'Jupiter', radiusKm: 69911 } as BodyProfile,
    orbital: [374322050280, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [35769600, 0, 3.12] as const,
  },
  Ganymede: {
    body: { kind: 'physical', name: 'Ganymede' } as BodyProfile,
    orbital: [618192000, 0] as const,
  },
  Callisto: {
    body: { kind: 'physical', name: 'Callisto' } as BodyProfile,
    orbital: [1441929600, 0] as const,
  },
  Saturn: {
    body: { kind: 'physical', name: 'Saturn', radiusKm: 58232 } as BodyProfile,
    orbital: [931964092416, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [37920035, 0, 25.33] as const,
  },
  Titan: {
    body: { kind: 'physical', name: 'Titan' } as BodyProfile,
    orbital: [1377684374, 0] as const,
  },
  Uranus: {
    body: { kind: 'physical', name: 'Uranus', radiusKm: 25362 } as BodyProfile,
    orbital: [2658822788376, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [62061120, 0, -82.23] as const,
  },
  Titania: {
    body: { kind: 'physical', name: 'Titania' } as BodyProfile,
    orbital: [752198400, 0] as const,
  },
  Neptune: {
    body: { kind: 'physical', name: 'Neptune', radiusKm: 24622 } as BodyProfile,
    orbital: [5200376904000, MEAN_SEASON_EPOCH_MSEC] as const,
    rotation: [64800000, 0, 28.32] as const,
  },
  Triton: {
    body: { kind: 'physical', name: 'Triton' } as BodyProfile,
    orbital: [507733056, 0] as const,
  },
  Pluto: {
    body: { kind: 'physical', name: 'Pluto', radiusKm: 1188.3 } as BodyProfile,
    orbital: [7818100727754, 0] as const,
    rotation: [551856672, 0, -60.41] as const,
  },
  Charon: {
    body: { kind: 'physical', name: 'Charon' } as BodyProfile,
    orbital: [551880000, 0] as const,
  },
  Ceres: {
    body: { kind: 'physical', name: 'Ceres', radiusKm: 469.7 } as BodyProfile,
    orbital: [145423814400, 0] as const,
    rotation: [32667012, 0, 4] as const,
  },
  Haumea: {
    body: { kind: 'physical', name: 'Haumea' } as BodyProfile,
    orbital: [8908394904000, 0] as const,
    rotation: [14095440, 0, 0] as const,
  },
  Namaka: {
    body: { kind: 'physical', name: 'Namaka' } as BodyProfile,
    orbital: [1579245120, 0] as const,
  },
  Hiiaka: {
    body: { kind: 'physical', name: 'Hiiaka' } as BodyProfile,
    orbital: [4273516800, 0] as const,
  },
  Makemake: {
    body: { kind: 'physical', name: 'Makemake' } as BodyProfile,
    orbital: [9639268920000, 0] as const,
    rotation: [27975600, 0, 0] as const,
  },
  Eris: {
    body: { kind: 'physical', name: 'Eris' } as BodyProfile,
    orbital: [17610403104000, 0] as const,
    rotation: [93240000, 0, 0] as const,
  },
  Dysnomia: {
    body: { kind: 'physical', name: 'Dysnomia' } as BodyProfile,
    orbital: [1362700800, 0] as const,
  },
} as const
