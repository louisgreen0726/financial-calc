import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { LanguageProvider, useLanguage } from "@/lib/i18n";

function LanguageHarness() {
  const { language, setLanguage } = useLanguage();
  const [persisted, setPersisted] = useState<boolean | null>(null);

  return (
    <>
      <span>{language}</span>
      <output>{persisted === null ? "idle" : String(persisted)}</output>
      <button type="button" onClick={() => setPersisted(setLanguage("zh"))}>
        Set Chinese
      </button>
    </>
  );
}

describe("LanguageProvider", () => {
  beforeEach(() => window.localStorage.clear());

  afterEach(() => vi.restoreAllMocks());

  it("reports a failed write while keeping the session language active", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });

    render(
      <LanguageProvider>
        <LanguageHarness />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Set Chinese" }));

    await waitFor(() => {
      expect(screen.getByText("zh")).toBeInTheDocument();
      expect(screen.getByText("false")).toBeInTheDocument();
      expect(document.documentElement).toHaveAttribute("lang", "zh");
    });
  });
});
