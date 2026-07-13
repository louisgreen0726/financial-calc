import { escapeMarkdownTableCell, generateShareMarkdown } from "@/lib/share-markdown";

describe("share Markdown generation", () => {
  const labels = {
    inputsHeading: "Inputs",
    resultsHeading: "Results",
    parameterLabel: "Parameter",
    metricLabel: "Metric",
    valueLabel: "Value",
  };

  it("escapes raw HTML in a user-controlled asset name, title, keys, and values", () => {
    const assetName = '<img src=x onerror="alert(1)"> Growth | Fund';
    const markdown = generateShareMarkdown({
      title: `<script>alert(1)</script> ${assetName}`,
      inputs: { [assetName]: '<svg onload="alert(1)">\nvalue' },
      results: { [`${assetName} result`]: "<iframe src=javascript:alert(1)>" },
      labels,
      formatResultValue: String,
    });

    expect(markdown).not.toContain("<script>");
    expect(markdown).not.toContain("<img ");
    expect(markdown).not.toContain("<svg ");
    expect(markdown).not.toContain("<iframe ");
    expect(markdown).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt; Growth \\| Fund");
    expect(markdown).toContain("&lt;svg onload=&quot;alert(1)&quot;&gt;<br>value");
    expect(markdown).toContain("&lt;iframe src=javascript:alert(1)&gt;");
  });

  it("escapes table separators after HTML escaping", () => {
    expect(escapeMarkdownTableCell("A < B | C")).toBe("A &lt; B \\| C");
  });

  it("neutralizes Markdown links and inline formatting in user-controlled text", () => {
    expect(escapeMarkdownTableCell("[click](javascript:alert(1)) *bold* `code`")).toBe(
      "\\[click\\](javascript:alert(1)) \\*bold\\* \\`code\\`"
    );
  });

  it("keeps every line-ending form inside the current Markdown block", () => {
    expect(escapeMarkdownTableCell("first\rsecond\r\nthird\nfourth | value")).toBe(
      "first<br>second<br>third<br>fourth \\| value"
    );

    const markdown = generateShareMarkdown({
      title: "Trusted report\r# Forged heading",
      inputs: { Amount: "100\r| forged | row" },
      results: { Total: "100" },
      labels,
      formatResultValue: String,
    });

    expect(markdown).not.toContain("\r");
    expect(markdown).toContain("## Trusted report<br># Forged heading\n");
    expect(markdown).toContain("| Amount | 100<br>\\| forged \\| row |");
  });
});
