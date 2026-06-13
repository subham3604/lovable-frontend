import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useStreamParser } from "../hooks/use-stream-parser";
import { ChatEventType } from "../lib/types";

describe("useStreamParser", () => {
  it("should parse closed tags correctly", () => {
    const rawContent = `
<thought>Thinking about fixing a bug</thought>
<message>I will help you fix the bug.</message>
<file path="src/App.tsx">
const a = 1;
</file>
    `;

    const { result } = renderHook(() => useStreamParser(rawContent));

    expect(result.current).toHaveLength(3);
    expect(result.current[0]).toEqual({
      type: ChatEventType.THOUGHT,
      content: "Thinking about fixing a bug",
      filePath: undefined,
      metadata: undefined,
    });
    expect(result.current[1]).toEqual({
      type: ChatEventType.MESSAGE,
      content: "I will help you fix the bug.",
      filePath: undefined,
      metadata: undefined,
    });
    expect(result.current[2]).toEqual({
      type: ChatEventType.FILE_EDIT,
      content: "const a = 1;",
      filePath: "src/App.tsx",
      metadata: undefined,
    });
  });

  it("should parse incomplete streaming tags correctly", () => {
    const rawContent = `
<thought>Thinking about a solution
    `;

    const { result } = renderHook(() => useStreamParser(rawContent));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual({
      type: ChatEventType.THOUGHT,
      content: "Thinking about a solution",
      filePath: undefined,
      metadata: undefined,
    });
  });

  it("should preserve trailing spaces for messages and thoughts, but trim tools/files", () => {
    const rawContent = `
<message>I will remove the </message>
<file path="test.js">  content  </file>
    `;

    const { result } = renderHook(() => useStreamParser(rawContent));

    expect(result.current).toHaveLength(2);
    expect(result.current[0].content).toBe("I will remove the ");
    expect(result.current[1].content).toBe("content");
  });
});
