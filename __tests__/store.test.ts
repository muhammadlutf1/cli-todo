import { describe, it, expect, jest } from "@jest/globals";
import type { TaskStatus } from "../src/types";

const mockedFS = {
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
};

jest.unstable_mockModule("node:fs", () => mockedFS);
const { readStorage, writeToStorage } = await import("../src/store");

describe("writeToStorage", () => {
  it("writes given data to storage file and returns tasks length", () => {
    const data = {
      next: 2,
      tasks: [
        {
          id: 1,
          title: "add unit tests",
          description: "https://github.com/muhammadlutf1/cli-todo",
          category: "dev",
          status: "todo" as TaskStatus,
          createdAtTimestamp: 1774949297914,
        },
      ],
    };

    expect(writeToStorage(data)).toBe(1);

    expect(mockedFS.writeFileSync.mock.calls[0][1]).toEqual(
      JSON.stringify(data),
    );
  });
});

describe("readStorage", () => {
  const init = { next: 1, tasks: [] };

  describe("if file does not exist", () => {
    it("creates and returns initial storage", () => {
      mockedFS.readdirSync.mockReturnValue([]);

      expect(readStorage()).toEqual(init);
      expect(mockedFS.writeFileSync).toHaveBeenCalled();
    });
  });

  describe("if file exist", () => {
    beforeEach(() => mockedFS.readdirSync.mockReturnValue(["tasks.json"]));

    it("overwrites and returns initial storage if invalid JSON", () => {
      mockedFS.readFileSync.mockReturnValue("{invalid: json}");

      expect(readStorage()).toEqual(init);
      expect(mockedFS.writeFileSync).toHaveBeenCalled();
    });

    it("overwrites and returns initial storage if `tasks` key missing", () => {
      mockedFS.readFileSync.mockReturnValue(`{"next": 99}`);

      expect(readStorage()).toEqual(init);
      expect(mockedFS.writeFileSync).toHaveBeenCalled();
    });

    it("recalculates and overwrites `next` key if missing", () => {
      mockedFS.readFileSync.mockReturnValue(`{"tasks": []}`);

      expect(readStorage().next).toBe(1);
      expect(mockedFS.writeFileSync).toHaveBeenCalled();

      mockedFS.readFileSync.mockReturnValue(`{"tasks": [{"id":2},{"id":33}]}`);

      expect(readStorage().next).toBe(34);
      expect(mockedFS.writeFileSync).toHaveBeenCalled();
    });

    it("overwrites and returns initial storage if `next` and `tasks` keys missing", () => {
      mockedFS.readFileSync.mockReturnValue(`{}`);

      expect(readStorage()).toEqual(init);
      expect(mockedFS.writeFileSync).toHaveBeenCalled();
    });
  });
});
