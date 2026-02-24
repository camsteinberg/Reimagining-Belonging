import { parseAIResponse } from "../lib/parseAIActions";

describe("parseAIResponse", () => {
  it("extracts actions from <actions> tags", () => {
    const text = 'Sure! Building the walls now. <actions>[{"row":0,"col":0,"block":"wall"},{"row":0,"col":1,"block":"wall"}]</actions>';
    const result = parseAIResponse(text);
    expect(result.text).toBe("Sure! Building the walls now.");
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0]).toEqual({ row: 0, col: 0, block: "wall", height: undefined });
  });

  it("returns empty actions when no tags present", () => {
    const result = parseAIResponse("Just describing the structure.");
    expect(result.text).toBe("Just describing the structure.");
    expect(result.actions).toHaveLength(0);
  });

  it("rejects invalid block types", () => {
    const text = '<actions>[{"row":0,"col":0,"block":"lava"}]</actions>';
    const result = parseAIResponse(text);
    expect(result.actions).toHaveLength(0);
  });

  it("rejects out-of-bounds coordinates", () => {
    const text = '<actions>[{"row":10,"col":0,"block":"wall"}]</actions>';
    const result = parseAIResponse(text);
    expect(result.actions).toHaveLength(0);
  });

  it("handles malformed JSON gracefully", () => {
    const text = '<actions>not valid json</actions> Some text here';
    const result = parseAIResponse(text);
    expect(result.text).toBe("Some text here");
    expect(result.actions).toHaveLength(0);
  });

  it("handles multiple valid and invalid actions", () => {
    const text = '<actions>[{"row":0,"col":0,"block":"wall"},{"row":-1,"col":0,"block":"wall"},{"row":3,"col":3,"block":"roof"}]</actions>';
    const result = parseAIResponse(text);
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0]).toEqual({ row: 0, col: 0, block: "wall", height: undefined });
    expect(result.actions[1]).toEqual({ row: 3, col: 3, block: "roof", height: undefined });
  });

  it("parses optional height field", () => {
    const text = '<actions>[{"row":0,"col":0,"height":1,"block":"wall"}]</actions>';
    const result = parseAIResponse(text);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toEqual({ row: 0, col: 0, height: 1, block: "wall" });
  });

  it("handles missing height field gracefully", () => {
    const text = '<actions>[{"row":0,"col":0,"block":"wall"}]</actions>';
    const result = parseAIResponse(text);
    expect(result.actions[0].height).toBeUndefined();
  });
});
