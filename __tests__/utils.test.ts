import { checkDateRange } from "../src/utils";

describe("checkDateRange utility", () => {
  describe("when only taskDate is given and everything else is nullish", () => {
    it("returns false as a default", () => {
      expect(checkDateRange(Date.now(), null)).toBe(false);
    });
  });

  describe("when taskDate and targetDate are given", () => {
    // covers wether taskStart/taskEnd given or not

    it("returns true when two timestamps are on the same day", () => {
      const taskDate = new Date(2026, 2, 1, 0, 0, 0);
      const targetDate = new Date(2026, 2, 1, 20, 30, 0);

      expect(checkDateRange(taskDate.getTime(), targetDate.getTime())).toBe(
        true,
      );
    });

    it("returns false when two timestamps are not on the same day", () => {
      const taskDate = new Date(2026, 2, 1, 23, 59, 59);
      const targetDate = new Date(2026, 2, 2, 0, 0, 0);
      // only 1 second difference

      expect(checkDateRange(taskDate.getTime(), targetDate.getTime())).toBe(
        false,
      );
    });
  });

  describe("when taskDate and targetStart are given", () => {
    it("returns true when taskDate timestamp = targetStart", () => {
      const taskDate = new Date(2026, 2, 3, 0, 0, 0);
      const targetStartDate = taskDate;

      const result = checkDateRange(
        taskDate.getTime(),
        null,
        targetStartDate.getTime(),
        null,
      );

      expect(result).toBe(true);
    });

    it("returns true when taskDate timestamp > targetStart", () => {
      const taskDate = new Date(2026, 2, 3, 0, 0, 0);
      const targetStartDate = new Date(2026, 2, 1, 20, 30, 0);

      const result = checkDateRange(
        taskDate.getTime(),
        null,
        targetStartDate.getTime(),
        null,
      );

      expect(result).toBe(true);
    });

    it("returns false when taskDate timestamp < targetStart", () => {
      const taskDate = new Date(2026, 2, 3, 0, 0, 0);
      const targetStartDate = new Date(2026, 2, 3, 20, 30, 0);

      const result = checkDateRange(
        taskDate.getTime(),
        null,
        targetStartDate.getTime(),
        null,
      );

      expect(result).toBe(false);
    });
  });

  describe("when taskDate and targetEnd are given", () => {
    it("returns true when taskDate timestamp = targetEnd", () => {
      const taskDate = new Date(2026, 2, 1, 20, 30, 0);
      const targetEndDate = taskDate;

      const result = checkDateRange(
        taskDate.getTime(),
        null,
        null,
        targetEndDate.getTime(),
      );

      expect(result).toBe(true);
    });

    it("returns true when taskDate timestamp < targetEnd", () => {
      const taskDate = new Date(2026, 2, 1, 20, 30, 0);
      const targetEndDate = new Date(2026, 2, 3, 0, 0, 0);

      const result = checkDateRange(
        taskDate.getTime(),
        null,
        null,
        targetEndDate.getTime(),
      );

      expect(result).toBe(true);
    });

    it("returns false when taskDate timestamp > targetEnd", () => {
      const taskDate = new Date(2026, 2, 3, 20, 30, 0);
      const targetEndDate = new Date(2026, 2, 3, 0, 0, 0);

      const result = checkDateRange(
        taskDate.getTime(),
        null,
        null,
        targetEndDate.getTime(),
      );

      expect(result).toBe(false);
    });
  });

  describe("when taskDate, targetStart and targetEnd are given", () => {
    it("returns true when taskDate timestamp is between targetStart and targetEnd", () => {
      const taskDate = new Date(2026, 2, 10, 1, 20, 0);
      const targetStartDate = new Date(2026, 2, 9, 0, 0, 0);
      const targetEndDate = new Date(2026, 2, 11, 0, 0, 0);

      const result = checkDateRange(
        taskDate.getTime(),
        null,
        targetStartDate.getTime(),
        targetEndDate.getTime(),
      );

      expect(result).toBe(true);
    });

    it("returns true when taskDate timestamp = targetStart", () => {
      const taskDate = new Date(2026, 2, 10, 1, 20, 0);
      const targetStartDate = taskDate;
      const targetEndDate = new Date(2026, 2, 11, 0, 0, 0);

      const result = checkDateRange(
        taskDate.getTime(),
        null,
        targetStartDate.getTime(),
        targetEndDate.getTime(),
      );

      expect(result).toBe(true);
    });

    it("returns true when taskDate timestamp = targetEnd", () => {
      const taskDate = new Date(2026, 2, 10, 1, 20, 0);
      const targetStartDate = new Date(2026, 2, 9, 0, 0, 0);
      const targetEndDate = taskDate;

      const result = checkDateRange(
        taskDate.getTime(),
        null,
        targetStartDate.getTime(),
        targetEndDate.getTime(),
      );

      expect(result).toBe(true);
    });

    it("returns false when taskDate timestamp isn't between targetStart and targetEnd", () => {
      const taskDate = new Date(2026, 2, 11, 1, 20, 0);
      const targetStartDate = new Date(2026, 2, 9, 0, 0, 0);
      const targetEndDate = new Date(2026, 2, 11, 0, 0, 0);

      const result = checkDateRange(
        taskDate.getTime(),
        null,
        targetStartDate.getTime(),
        targetEndDate.getTime(),
      );

      expect(result).toBe(false);
    });
  });
});
