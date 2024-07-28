import { atom } from 'recoil';

const years = [
  1896, 1900, 1904, 1908, 1912, 1920, 1924, 1928, 1932, 1936, 1948, 1952, 1956,
  1960, 1964, 1968, 1972, 1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008,
  2012,
];

export const yearFilterState = atom({
  key: 'yearFilterState',
  default: {
    start: years[0],
    end: years[years.length - 1],
  },
});

export const yearsState = atom({
  key: 'yearsState',
  default: years,
});

