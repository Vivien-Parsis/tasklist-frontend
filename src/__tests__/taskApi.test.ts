import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	getTasks,
	getTask,
	createTask,
	updateTask,
	deleteTask
} from "../api/taskApi";

const mockTask = {
	id: 1,
	title: "Test",
	description: null,
	completed: false,
	createdAt: "2026-01-15T10:00:00Z",
	updatedAt: "2026-01-15T10:00:00Z"
};

// Stub a fetch that resolves to an OK response with the given JSON body.
function stubOkFetch(body: unknown) {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: true,
		status: 200,
		json: () => Promise.resolve(body),
		text: () => Promise.resolve("")
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

// Stub a fetch that resolves to a non-OK response with a text body.
function stubErrorFetch(status: number, text: string) {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: false,
		status,
		json: () => Promise.resolve({}),
		text: () => Promise.resolve(text)
	});
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

beforeEach(() => {
	vi.restoreAllMocks();
});

describe("taskApi", () => {
	describe("getTasks", () => {
		it("returns the array of tasks", async () => {
			stubOkFetch([mockTask]);

			const tasks = await getTasks();

			expect(tasks).toEqual([mockTask]);
			expect(fetch).toHaveBeenCalledWith("/api/tasks");
		});

		it("throws an HTTP error when the response is not ok", async () => {
			stubErrorFetch(500, "Internal Server Error");

			await expect(getTasks()).rejects.toThrow(
				"HTTP 500: Internal Server Error"
			);
		});
	});

	describe("getTask", () => {
		it("fetches a single task by id", async () => {
			stubOkFetch(mockTask);

			const task = await getTask(1);

			expect(task).toEqual(mockTask);
			expect(fetch).toHaveBeenCalledWith("/api/tasks/1");
		});

		it("throws when the task is not found", async () => {
			stubErrorFetch(404, "Task not found");

			await expect(getTask(999)).rejects.toThrow(
				"HTTP 404: Task not found"
			);
		});
	});

	describe("createTask", () => {
		it("sends a POST with JSON body and returns the created task", async () => {
			stubOkFetch(mockTask);
			const payload = { title: "New task", description: "desc" };

			const task = await createTask(payload);

			expect(task).toEqual(mockTask);
			expect(fetch).toHaveBeenCalledWith("/api/tasks", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});
		});

		it("throws when creation fails validation", async () => {
			stubErrorFetch(400, "Title is required");

			await expect(createTask({ title: "" })).rejects.toThrow(
				"HTTP 400: Title is required"
			);
		});
	});

	describe("updateTask", () => {
		it("sends a PUT with JSON body and returns the updated task", async () => {
			const updated = { ...mockTask, completed: true };
			stubOkFetch(updated);
			const payload = { completed: true };

			const task = await updateTask(1, payload);

			expect(task).toEqual(updated);
			expect(fetch).toHaveBeenCalledWith("/api/tasks/1", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});
		});

		it("throws when the task to update does not exist", async () => {
			stubErrorFetch(404, "Task not found");

			await expect(updateTask(999, { title: "x" })).rejects.toThrow(
				"HTTP 404: Task not found"
			);
		});
	});

	describe("deleteTask", () => {
		it("sends a DELETE and resolves without a value", async () => {
			const fetchMock = stubOkFetch(undefined);

			await expect(deleteTask(1)).resolves.toBeUndefined();
			expect(fetchMock).toHaveBeenCalledWith("/api/tasks/1", {
				method: "DELETE"
			});
		});

		it("throws when the delete response is not ok", async () => {
			stubErrorFetch(404, "Task not found");

			await expect(deleteTask(999)).rejects.toThrow(
				"HTTP 404: Task not found"
			);
		});
	});
});
