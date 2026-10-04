export type DefenseNodeType = 'standard' | 'power' | 'range' | 'amplifier';

export interface DefenseNodeDef {
  id: number;
  x: number;
  y: number;
  type: DefenseNodeType;
  label: string;
  bonusDesc: string;
  speedMult: number;
  rangeMult: number;
  damageMult: number;
}

export const MAP_DEFENSE_NODES: Record<string, DefenseNodeDef[]> = {
  first_contact: [
    {
      id: 1,
      x: 180,
      y: 95,
      type: 'standard',
      label: 'Slot 01',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 2,
      x: 300,
      y: 95,
      type: 'range',
      label: 'Slot 02',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 3,
      x: 180,
      y: 225,
      type: 'power',
      label: 'Slot 03',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 4,
      x: 300,
      y: 225,
      type: 'standard',
      label: 'Slot 04',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 5,
      x: 520,
      y: 160,
      type: 'amplifier',
      label: 'Slot 05',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 6,
      x: 380,
      y: 320,
      type: 'standard',
      label: 'Slot 06',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 7,
      x: 520,
      y: 320,
      type: 'power',
      label: 'Slot 07',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 8,
      x: 380,
      y: 440,
      type: 'range',
      label: 'Slot 08',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 9,
      x: 620,
      y: 430,
      type: 'standard',
      label: 'Slot 09',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 10,
      x: 740,
      y: 430,
      type: 'amplifier',
      label: 'Slot 10',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 11,
      x: 620,
      y: 570,
      type: 'power',
      label: 'Slot 11',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 12,
      x: 740,
      y: 570,
      type: 'standard',
      label: 'Slot 12',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 13,
      x: 910,
      y: 380,
      type: 'range',
      label: 'Slot 13',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 14,
      x: 910,
      y: 180,
      type: 'amplifier',
      label: 'Slot 14',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 15,
      x: 1060,
      y: 190,
      type: 'standard',
      label: 'Slot 15',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 16,
      x: 1060,
      y: 330,
      type: 'power',
      label: 'Slot 16',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    }
  ],
  swarm_protocol: [
    {
      id: 1,
      x: 160,
      y: 65,
      type: 'standard',
      label: 'Slot 01',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 2,
      x: 280,
      y: 65,
      type: 'power',
      label: 'Slot 02',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 3,
      x: 430,
      y: 195,
      type: 'standard',
      label: 'Slot 03',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 4,
      x: 290,
      y: 340,
      type: 'range',
      label: 'Slot 04',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 5,
      x: 430,
      y: 480,
      type: 'power',
      label: 'Slot 05',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 6,
      x: 540,
      y: 630,
      type: 'amplifier',
      label: 'Slot 06',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 7,
      x: 610,
      y: 420,
      type: 'standard',
      label: 'Slot 07',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 8,
      x: 750,
      y: 420,
      type: 'power',
      label: 'Slot 08',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 9,
      x: 610,
      y: 260,
      type: 'range',
      label: 'Slot 09',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 10,
      x: 750,
      y: 115,
      type: 'amplifier',
      label: 'Slot 10',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 11,
      x: 870,
      y: 115,
      type: 'standard',
      label: 'Slot 11',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 12,
      x: 1050,
      y: 240,
      type: 'power',
      label: 'Slot 12',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 13,
      x: 910,
      y: 380,
      type: 'range',
      label: 'Slot 13',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 14,
      x: 1050,
      y: 550,
      type: 'standard',
      label: 'Slot 14',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 15,
      x: 1140,
      y: 400,
      type: 'amplifier',
      label: 'Slot 15',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    }
  ],
  blackout: [
    {
      id: 1,
      x: 160,
      y: 110,
      type: 'standard',
      label: 'Slot 01',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 2,
      x: 260,
      y: 250,
      type: 'range',
      label: 'Slot 02',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 3,
      x: 380,
      y: 260,
      type: 'power',
      label: 'Slot 03',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 4,
      x: 360,
      y: 440,
      type: 'standard',
      label: 'Slot 04',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 5,
      x: 500,
      y: 600,
      type: 'amplifier',
      label: 'Slot 05',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 6,
      x: 580,
      y: 420,
      type: 'power',
      label: 'Slot 06',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 7,
      x: 670,
      y: 280,
      type: 'standard',
      label: 'Slot 07',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 8,
      x: 800,
      y: 110,
      type: 'range',
      label: 'Slot 08',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 9,
      x: 890,
      y: 260,
      type: 'amplifier',
      label: 'Slot 09',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 10,
      x: 880,
      y: 440,
      type: 'power',
      label: 'Slot 10',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 11,
      x: 1000,
      y: 580,
      type: 'standard',
      label: 'Slot 11',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 12,
      x: 1080,
      y: 420,
      type: 'range',
      label: 'Slot 12',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 13,
      x: 1140,
      y: 260,
      type: 'amplifier',
      label: 'Slot 13',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    }
  ],
  overdrive: [
    {
      id: 1,
      x: 160,
      y: 430,
      type: 'standard',
      label: 'Slot 01',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 2,
      x: 220,
      y: 270,
      type: 'power',
      label: 'Slot 02',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 3,
      x: 380,
      y: 80,
      type: 'range',
      label: 'Slot 03',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 4,
      x: 560,
      y: 80,
      type: 'amplifier',
      label: 'Slot 04',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 5,
      x: 740,
      y: 80,
      type: 'standard',
      label: 'Slot 05',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 6,
      x: 960,
      y: 220,
      type: 'power',
      label: 'Slot 06',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 7,
      x: 960,
      y: 400,
      type: 'amplifier',
      label: 'Slot 07',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 8,
      x: 800,
      y: 510,
      type: 'range',
      label: 'Slot 08',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 9,
      x: 640,
      y: 510,
      type: 'power',
      label: 'Slot 09',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 10,
      x: 420,
      y: 480,
      type: 'standard',
      label: 'Slot 10',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 11,
      x: 600,
      y: 280,
      type: 'amplifier',
      label: 'Slot 11',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 12,
      x: 750,
      y: 280,
      type: 'range',
      label: 'Slot 12',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 13,
      x: 1040,
      y: 460,
      type: 'standard',
      label: 'Slot 13',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 14,
      x: 1120,
      y: 270,
      type: 'power',
      label: 'Slot 14',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    }
  ],
  hardcore: [
    {
      id: 1,
      x: 150,
      y: 75,
      type: 'standard',
      label: 'Slot 01',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 2,
      x: 180,
      y: 320,
      type: 'range',
      label: 'Slot 02',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 3,
      x: 330,
      y: 480,
      type: 'power',
      label: 'Slot 03',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 4,
      x: 440,
      y: 340,
      type: 'amplifier',
      label: 'Slot 04',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 5,
      x: 440,
      y: 190,
      type: 'standard',
      label: 'Slot 05',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 6,
      x: 600,
      y: 90,
      type: 'power',
      label: 'Slot 06',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 7,
      x: 700,
      y: 240,
      type: 'range',
      label: 'Slot 07',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 8,
      x: 700,
      y: 420,
      type: 'amplifier',
      label: 'Slot 08',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 9,
      x: 860,
      y: 500,
      type: 'standard',
      label: 'Slot 09',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 10,
      x: 920,
      y: 340,
      type: 'power',
      label: 'Slot 10',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 11,
      x: 920,
      y: 190,
      type: 'range',
      label: 'Slot 11',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 12,
      x: 1080,
      y: 420,
      type: 'amplifier',
      label: 'Slot 12',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 13,
      x: 1140,
      y: 230,
      type: 'standard',
      label: 'Slot 13',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    }
  ],
  boss_rush: [
    {
      id: 1,
      x: 170,
      y: 140,
      type: 'standard',
      label: 'Slot 01',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 2,
      x: 280,
      y: 140,
      type: 'power',
      label: 'Slot 02',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 3,
      x: 500,
      y: 70,
      type: 'amplifier',
      label: 'Slot 03',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 4,
      x: 700,
      y: 70,
      type: 'range',
      label: 'Slot 04',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 5,
      x: 850,
      y: 70,
      type: 'power',
      label: 'Slot 05',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 6,
      x: 1020,
      y: 200,
      type: 'amplifier',
      label: 'Slot 06',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 7,
      x: 1020,
      y: 400,
      type: 'range',
      label: 'Slot 07',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 8,
      x: 860,
      y: 510,
      type: 'power',
      label: 'Slot 08',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 9,
      x: 680,
      y: 510,
      type: 'standard',
      label: 'Slot 09',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 10,
      x: 500,
      y: 510,
      type: 'amplifier',
      label: 'Slot 10',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 11,
      x: 220,
      y: 480,
      type: 'power',
      label: 'Slot 11',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 12,
      x: 520,
      y: 280,
      type: 'range',
      label: 'Slot 12',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 13,
      x: 700,
      y: 280,
      type: 'amplifier',
      label: 'Slot 13',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 14,
      x: 1080,
      y: 480,
      type: 'standard',
      label: 'Slot 14',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    }
  ],
  last_orbit: [
    {
      id: 1,
      x: 180,
      y: 76,
      type: 'standard',
      label: 'Slot 01',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 2,
      x: 260,
      y: 76,
      type: 'range',
      label: 'Slot 02',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 3,
      x: 260,
      y: 210,
      type: 'power',
      label: 'Slot 03',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 4,
      x: 420,
      y: 250,
      type: 'standard',
      label: 'Slot 04',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 5,
      x: 240,
      y: 440,
      type: 'range',
      label: 'Slot 05',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 6,
      x: 90,
      y: 480,
      type: 'amplifier',
      label: 'Slot 06',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 7,
      x: 380,
      y: 500,
      type: 'power',
      label: 'Slot 07',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 8,
      x: 540,
      y: 500,
      type: 'standard',
      label: 'Slot 08',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 9,
      x: 700,
      y: 480,
      type: 'amplifier',
      label: 'Slot 09',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 10,
      x: 540,
      y: 340,
      type: 'power',
      label: 'Slot 10',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 11,
      x: 700,
      y: 220,
      type: 'range',
      label: 'Slot 11',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 12,
      x: 800,
      y: 140,
      type: 'standard',
      label: 'Slot 12',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 13,
      x: 960,
      y: 140,
      type: 'power',
      label: 'Slot 13',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 14,
      x: 800,
      y: 360,
      type: 'amplifier',
      label: 'Slot 14',
      bonusDesc: '+25% Weapon Damage',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1.25
    },
    {
      id: 15,
      x: 960,
      y: 360,
      type: 'range',
      label: 'Slot 15',
      bonusDesc: '+25% Weapon Range',
      speedMult: 1,
      rangeMult: 1.25,
      damageMult: 1
    },
    {
      id: 16,
      x: 1040,
      y: 560,
      type: 'standard',
      label: 'Slot 16',
      bonusDesc: 'Standard Defense Socket',
      speedMult: 1,
      rangeMult: 1,
      damageMult: 1
    },
    {
      id: 17,
      x: 1220,
      y: 460,
      type: 'power',
      label: 'Slot 17',
      bonusDesc: '+25% Attack Speed',
      speedMult: 1.25,
      rangeMult: 1,
      damageMult: 1
    }
  ]
};

// Global active defense nodes list for the current map
export let DEFENSE_NODES: DefenseNodeDef[] = MAP_DEFENSE_NODES.first_contact;

export function setActiveDefenseNodes(mapId: string): DefenseNodeDef[] {
  DEFENSE_NODES = MAP_DEFENSE_NODES[mapId] || MAP_DEFENSE_NODES.first_contact;
  return DEFENSE_NODES;
}

export function getNodeById(id: number): DefenseNodeDef | undefined {
  return DEFENSE_NODES.find(n => n.id === id);
}
