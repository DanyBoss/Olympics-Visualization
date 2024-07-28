import { selector } from "recoil";
import { yearsState, yearFilterState } from "./atoms";

export const filteredYearsState = selector({
  key: "filteredYearsState",
  get: ({ get }) => {
    const years = get(yearsState);
    const { start, end } = get(yearFilterState);
    return years.filter((year) => year >= start && year <= end);
  },
});
