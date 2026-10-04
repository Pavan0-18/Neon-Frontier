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

export const DEFENSE_NODES: DefenseNodeDef[] = [
  // Sector 1: Conduit Entry & First Sweep (Y: 70 - 210)
  { id: 1, x: 140, y: 76, type: 'standard', label: 'Node Alpha-1', bonusDesc: 'Standard Tactical Anchor', speedMult: 1, rangeMult: 1, damageMult: 1 },
  { id: 2, x: 230, y: 76, type: 'range', label: 'Node Alpha-2', bonusDesc: '+25% Weapon Range', speedMult: 1, rangeMult: 1.25, damageMult: 1 },
  { id: 3, x: 140, y: 204, type: 'standard', label: 'Node Alpha-3', bonusDesc: 'Standard Tactical Anchor', speedMult: 1, rangeMult: 1, damageMult: 1 },
  { id: 4, x: 230, y: 204, type: 'power', label: 'Node Alpha-4', bonusDesc: '+20% Attack Rate', speedMult: 1.25, rangeMult: 1, damageMult: 1 },

  // Sector 2: First Hairpin & Descent (X: 340-410, Y: 140-360)
  { id: 5, x: 410, y: 140, type: 'amplifier', label: 'Node Beta-1', bonusDesc: '+25% Kinetic/Thermal Damage', speedMult: 1, rangeMult: 1, damageMult: 1.25 },
  { id: 6, x: 410, y: 250, type: 'standard', label: 'Node Beta-2', bonusDesc: 'Standard Tactical Anchor', speedMult: 1, rangeMult: 1, damageMult: 1 },
  { id: 7, x: 410, y: 360, type: 'power', label: 'Node Beta-3', bonusDesc: '+20% Attack Rate', speedMult: 1.25, rangeMult: 1, damageMult: 1 },

  // Sector 3: Interior Switchback (X: 160-340, Y: 280-450)
  { id: 8, x: 250, y: 280, type: 'range', label: 'Node Gamma-1', bonusDesc: '+25% Weapon Range', speedMult: 1, rangeMult: 1.25, damageMult: 1 },
  { id: 9, x: 250, y: 440, type: 'standard', label: 'Node Gamma-2', bonusDesc: 'Standard Tactical Anchor', speedMult: 1, rangeMult: 1, damageMult: 1 },
  { id: 10, x: 90, y: 360, type: 'amplifier', label: 'Node Gamma-3', bonusDesc: '+25% Kinetic/Thermal Damage', speedMult: 1, rangeMult: 1, damageMult: 1.25 },
  { id: 11, x: 90, y: 470, type: 'standard', label: 'Node Gamma-4', bonusDesc: 'Standard Tactical Anchor', speedMult: 1, rangeMult: 1, damageMult: 1 },

  // Sector 4: Lower Conduit Causeway (X: 160-620, Y: 510-650)
  { id: 12, x: 160, y: 648, type: 'standard', label: 'Node Delta-1', bonusDesc: 'Standard Tactical Anchor', speedMult: 1, rangeMult: 1, damageMult: 1 },
  { id: 13, x: 280, y: 648, type: 'power', label: 'Node Delta-2', bonusDesc: '+20% Attack Rate', speedMult: 1.25, rangeMult: 1, damageMult: 1 },
  { id: 14, x: 400, y: 648, type: 'amplifier', label: 'Node Delta-3', bonusDesc: '+25% Kinetic/Thermal Damage', speedMult: 1, rangeMult: 1, damageMult: 1.25 },
  { id: 15, x: 520, y: 648, type: 'range', label: 'Node Delta-4', bonusDesc: '+25% Weapon Range', speedMult: 1, rangeMult: 1.25, damageMult: 1 },
  { id: 16, x: 340, y: 510, type: 'standard', label: 'Node Delta-5', bonusDesc: 'Standard Tactical Anchor', speedMult: 1, rangeMult: 1, damageMult: 1 },
  { id: 17, x: 470, y: 510, type: 'power', label: 'Node Delta-6', bonusDesc: '+20% Attack Rate', speedMult: 1.25, rangeMult: 1, damageMult: 1 },

  // Sector 5: Central Ascent (X: 550-690, Y: 220-500)
  { id: 18, x: 550, y: 410, type: 'standard', label: 'Node Epsilon-1', bonusDesc: 'Standard Tactical Anchor', speedMult: 1, rangeMult: 1, damageMult: 1 },
  { id: 19, x: 550, y: 290, type: 'amplifier', label: 'Node Epsilon-2', bonusDesc: '+25% Kinetic/Thermal Damage', speedMult: 1, rangeMult: 1, damageMult: 1.25 },
  { id: 20, x: 690, y: 490, type: 'range', label: 'Node Epsilon-3', bonusDesc: '+25% Weapon Range', speedMult: 1, rangeMult: 1.25, damageMult: 1 },
  { id: 21, x: 690, y: 370, type: 'power', label: 'Node Epsilon-4', bonusDesc: '+20% Attack Rate', speedMult: 1.25, rangeMult: 1, damageMult: 1 },
  { id: 22, x: 690, y: 220, type: 'standard', label: 'Node Epsilon-5', bonusDesc: 'Standard Tactical Anchor', speedMult: 1, rangeMult: 1, damageMult: 1 },

  // Sector 6: Upper East Flank (X: 750-950, Y: 140-350)
  { id: 23, x: 750, y: 150, type: 'range', label: 'Node Zeta-1', bonusDesc: '+25% Weapon Range', speedMult: 1, rangeMult: 1.25, damageMult: 1 },
  { id: 24, x: 880, y: 140, type: 'amplifier', label: 'Node Zeta-2', bonusDesc: '+25% Kinetic/Thermal Damage', speedMult: 1, rangeMult: 1, damageMult: 1.25 },
  { id: 25, x: 750, y: 290, type: 'standard', label: 'Node Zeta-3', bonusDesc: 'Standard Tactical Anchor', speedMult: 1, rangeMult: 1, damageMult: 1 },
  { id: 26, x: 950, y: 230, type: 'power', label: 'Node Zeta-4', bonusDesc: '+20% Attack Rate', speedMult: 1.25, rangeMult: 1, damageMult: 1 },
  { id: 27, x: 950, y: 360, type: 'range', label: 'Node Zeta-5', bonusDesc: '+25% Weapon Range', speedMult: 1, rangeMult: 1.25, damageMult: 1 },

  // Sector 7: Core Approach & Perimeter (X: 810-1210, Y: 300-550)
  { id: 28, x: 810, y: 440, type: 'standard', label: 'Node Omega-1', bonusDesc: 'Standard Tactical Anchor', speedMult: 1, rangeMult: 1, damageMult: 1 },
  { id: 29, x: 1010, y: 550, type: 'amplifier', label: 'Node Omega-2', bonusDesc: '+25% Kinetic/Thermal Damage', speedMult: 1, rangeMult: 1, damageMult: 1.25 },
  { id: 30, x: 1010, y: 400, type: 'power', label: 'Node Omega-3', bonusDesc: '+20% Attack Rate', speedMult: 1.25, rangeMult: 1, damageMult: 1 },
  { id: 31, x: 1070, y: 280, type: 'range', label: 'Node Omega-4', bonusDesc: '+25% Weapon Range', speedMult: 1, rangeMult: 1.25, damageMult: 1 },
  { id: 32, x: 1210, y: 440, type: 'amplifier', label: 'Node Omega-5', bonusDesc: '+25% Kinetic/Thermal Damage', speedMult: 1, rangeMult: 1, damageMult: 1.25 },
  { id: 33, x: 1210, y: 290, type: 'power', label: 'Node Omega-6', bonusDesc: '+20% Attack Rate', speedMult: 1.25, rangeMult: 1, damageMult: 1 }
];
