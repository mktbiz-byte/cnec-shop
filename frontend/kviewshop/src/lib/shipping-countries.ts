export interface Country {
  code: string;
  nameKey: string; // i18n key under brandSettings.countries
}

export interface Region {
  id: string;
  nameKey: string; // i18n key under brandSettings.regions
  countries: Country[];
}

export const SHIPPING_REGIONS: Region[] = [
  {
    id: 'east_asia',
    nameKey: 'eastAsia',
    countries: [
      { code: 'JP', nameKey: 'japan' },
      { code: 'CN', nameKey: 'china' },
      { code: 'TW', nameKey: 'taiwan' },
      { code: 'HK', nameKey: 'hongKong' },
    ],
  },
  {
    id: 'southeast_asia',
    nameKey: 'southeastAsia',
    countries: [
      { code: 'TH', nameKey: 'thailand' },
      { code: 'VN', nameKey: 'vietnam' },
      { code: 'PH', nameKey: 'philippines' },
      { code: 'ID', nameKey: 'indonesia' },
      { code: 'MY', nameKey: 'malaysia' },
      { code: 'SG', nameKey: 'singapore' },
    ],
  },
  {
    id: 'north_america',
    nameKey: 'northAmerica',
    countries: [
      { code: 'US', nameKey: 'usa' },
      { code: 'CA', nameKey: 'canada' },
    ],
  },
  {
    id: 'europe',
    nameKey: 'europe',
    countries: [
      { code: 'GB', nameKey: 'uk' },
      { code: 'DE', nameKey: 'germany' },
      { code: 'FR', nameKey: 'france' },
      { code: 'IT', nameKey: 'italy' },
      { code: 'ES', nameKey: 'spain' },
      { code: 'NL', nameKey: 'netherlands' },
      { code: 'PL', nameKey: 'poland' },
      { code: 'SE', nameKey: 'sweden' },
    ],
  },
  {
    id: 'middle_east',
    nameKey: 'middleEast',
    countries: [
      { code: 'AE', nameKey: 'uae' },
      { code: 'SA', nameKey: 'saudiArabia' },
      { code: 'KW', nameKey: 'kuwait' },
      { code: 'QA', nameKey: 'qatar' },
      { code: 'BH', nameKey: 'bahrain' },
    ],
  },
  {
    id: 'russia_cis',
    nameKey: 'russiaCis',
    countries: [
      { code: 'RU', nameKey: 'russia' },
      { code: 'KZ', nameKey: 'kazakhstan' },
      { code: 'UZ', nameKey: 'uzbekistan' },
    ],
  },
  {
    id: 'south_america',
    nameKey: 'southAmerica',
    countries: [
      { code: 'BR', nameKey: 'brazil' },
      { code: 'AR', nameKey: 'argentina' },
      { code: 'CL', nameKey: 'chile' },
      { code: 'CO', nameKey: 'colombia' },
      { code: 'MX', nameKey: 'mexico' },
    ],
  },
  {
    id: 'oceania',
    nameKey: 'oceania',
    countries: [
      { code: 'AU', nameKey: 'australia' },
      { code: 'NZ', nameKey: 'newZealand' },
    ],
  },
];

export const CERTIFICATION_TYPES = [
  { id: 'kfda', nameKey: 'kfda', descKey: 'kfdaDesc' },
  { id: 'iso22716', nameKey: 'iso22716', descKey: 'iso22716Desc' },
  { id: 'cpnp', nameKey: 'cpnp', descKey: 'cpnpDesc' },
  { id: 'fda', nameKey: 'fda', descKey: 'fdaDesc' },
  { id: 'nmpa', nameKey: 'nmpa', descKey: 'nmpaDesc' },
  { id: 'halal', nameKey: 'halal', descKey: 'halalDesc' },
  { id: 'vegan', nameKey: 'vegan', descKey: 'veganDesc' },
  { id: 'crueltyFree', nameKey: 'crueltyFree', descKey: 'crueltyFreeDesc' },
  { id: 'ewg', nameKey: 'ewg', descKey: 'ewgDesc' },
] as const;

export type CertificationType = typeof CERTIFICATION_TYPES[number]['id'];

export function getAllCountryCodes(): string[] {
  return SHIPPING_REGIONS.flatMap(r => r.countries.map(c => c.code));
}

export function getRegionCountryCodes(regionId: string): string[] {
  const region = SHIPPING_REGIONS.find(r => r.id === regionId);
  return region ? region.countries.map(c => c.code) : [];
}
