import { describe, it, expect, jest } from "@jest/globals";
import type { TaskStatus } from "../src/types";

const mockedFS = {
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
};

jest.unstable_mockModule("node:fs", () => mockedFS);
const { readStorage, writeToStorage, createTask, updateTask, _clearCache } =
  await import("../src/store");

describe("store.ts", () => {
  beforeEach(() => _clearCache());

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

        mockedFS.readFileSync.mockReturnValue(
          `{"tasks": [{"id":2},{"id":33}]}`,
        );

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

  describe("createTask", () => {
    it("pushes new task to storage and increments next key", () => {
      mockedFS.readdirSync.mockReturnValue(["tasks.json"]);
      mockedFS.readFileSync.mockReturnValue(`{"next": 1, "tasks": []}`);

      const returnedId = createTask(
        "add unit tests",
        "https://github.com/muhammadlutf1/cli-todo",
        "dev",
      );

      expect(returnedId).toEqual(1);
      const result = JSON.parse(
        mockedFS.writeFileSync.mock.calls[0][1] as string,
      );

      expect(result["next"]).toBe(2);
      expect(result["tasks"][0]["id"]).toBe(1);
      expect(result["tasks"][0]["title"]).toBe("add unit tests");
      expect(result["tasks"][0]["description"]).toBe(
        "https://github.com/muhammadlutf1/cli-todo",
      );
      expect(result["tasks"][0]["category"]).toBe("dev");
      expect(result["tasks"][0]["status"]).toBe("todo");
      expect(result["tasks"][0]["createdAtTimestamp"]).toEqual(
        expect.any(Number),
      );
    });
  });

  describe("updateTask", () => {
    it("throws error if no update field given", () => {
      expect(() => updateTask(1, {})).toThrow(
        "Expected 1 Update Field At Least",
      );
    });

    it("throws error if task not found", () => {
      mockedFS.readdirSync.mockReturnValue(["tasks.json"]);
      mockedFS.readFileSync.mockReturnValue(`{"next": 1, "tasks": []}`);

      expect(() => updateTask(10, { title: "test" })).toThrow(
        "Task Not Found (ID: 10)",
      );
    });

    it("updates task data and returns task id", () => {
      mockedFS.readdirSync.mockReturnValue(["tasks.json"]);
      mockedFS.readFileSync.mockReturnValue(
        `{"next": 4, "tasks": [{"id": 3, "title": "test", "description": "test desc", "category": "jest", "status": "todo", "createdAtTimestamp": 1774949297914}]}`,
      );

      const returnedId = updateTask(3, { title: "test2", status: "done" });

      expect(returnedId).toBe(3);
      const result = JSON.parse(
        mockedFS.writeFileSync.mock.calls.at(-1)?.[1] as string,
      );

      expect(result["next"]).toBe(4);
      expect(result["tasks"][0]["id"]).toBe(3);
      expect(result["tasks"][0]["title"]).toBe("test2");
      expect(result["tasks"][0]["description"]).toBe("test desc");
      expect(result["tasks"][0]["category"]).toBe("jest");
      expect(result["tasks"][0]["status"]).toBe("done");
      expect(result["tasks"][0]["createdAtTimestamp"]).toBe(1774949297914);

      expect(result["tasks"][0]["updatedAtTimestamp"]).toEqual(
        expect.any(Number),
      );
    });
  });
});
