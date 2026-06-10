export type DeliveryZone = {
  id: string;
  name: string;
  fee: number;
};

export const LAGOS_ZONE_PRESETS: DeliveryZone[] = [
  { id: "lagos-mainland", name: "Lagos Mainland", fee: 1500 },
  { id: "lagos-island", name: "Lagos Island", fee: 2000 },
  { id: "ikeja", name: "Ikeja & environs", fee: 1500 },
  { id: "lekki", name: "Lekki / Ajah", fee: 2500 },
];

export const ABUJA_ZONE_PRESETS: DeliveryZone[] = [
  { id: "abuja-central", name: "Abuja Central", fee: 1500 },
  { id: "abuja-suburbs", name: "Abuja suburbs", fee: 2000 },
];

export const NATIONWIDE_ZONE_PRESET: DeliveryZone = {
  id: "nationwide",
  name: "Nationwide delivery",
  fee: 3500,
};
