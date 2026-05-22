import { parseRuleName } from "../parseRuleName";

describe("parseRuleName", () => {
  describe("valid names (no special characters)", () => {
    it("returns no error for a plain alphanumeric name", () => {
      expect(parseRuleName("rule1").error).toBeNull();
    });

    it("returns no error for a name with underscores", () => {
      expect(parseRuleName("my_nat_rule").error).toBeNull();
    });

    it("returns no error for a name with spaces (replaces them)", () => {
      expect(parseRuleName("my nat rule").error).toBeNull();
    });

    it("returns no error for an empty string", () => {
      expect(parseRuleName("").error).toBeNull();
    });
  });

  describe("space to underscore conversion", () => {
    it("replaces a single space with an underscore", () => {
      expect(parseRuleName("new rule").value).toBe("new_rule");
    });

    it("replaces multiple spaces with underscores", () => {
      expect(parseRuleName("my nat rule").value).toBe("my_nat_rule");
    });

    it("does not alter names that already use underscores", () => {
      expect(parseRuleName("new_rule").value).toBe("new_rule");
    });
  });

  describe("invalid names (special characters)", () => {
    it("returns an error for a dash (-)", () => {
      expect(parseRuleName("new-rule").error).not.toBeNull();
    });

    it("returns an error for an exclamation mark (!)", () => {
      expect(parseRuleName("rule!").error).not.toBeNull();
    });

    it("returns an error for an at-sign (@)", () => {
      expect(parseRuleName("rule@name").error).not.toBeNull();
    });

    it("returns an error for a hash (#)", () => {
      expect(parseRuleName("rule#1").error).not.toBeNull();
    });

    it("returns an error for a dot (.)", () => {
      expect(parseRuleName("rule.name").error).not.toBeNull();
    });

    it("returns the raw (unmodified) value when the name is invalid", () => {
      expect(parseRuleName("new-rule").value).toBe("new-rule");
    });
  });
});
