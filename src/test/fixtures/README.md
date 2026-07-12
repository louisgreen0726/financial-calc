# Financial Reference Fixtures

`financial-reference-cases.json` contains externally maintained test vectors copied from pinned upstream commits.
The expected values must not be regenerated with `src/lib/finance-math.ts` or another implementation in this
repository.

## Sources

- NumPy Financial, `test_financial.py`, commit `f47e8af289f9abd34002267c6663869b9ed586a8`, BSD-3-Clause. The selected
  vectors cover PV, FV, PMT, NPER, RATE, NPV, and positive/negative IRR. Some upstream expected values were originally
  checked against Google Sheets; the fixture preserves the upstream tolerance when only rounded values are published.
- OpenGamma Strata, `BlackScholesFormulaRepositoryTest.java`, commit
  `39c46e342a4a95ac083d66287f038f6ae276692a`, Apache-2.0. The selected call prices come from Strata's precomputed
  9-strike x 7-volatility x 7-rate matrix.

Strata accepts risk-free rate `r` and cost of carry `b`. For a continuously yielding equity,
`b = r - q`, so the fixture stores `dividendYield = r - b` for this application's Black-Scholes-Merton signature.
The selected Strata matrix uses `b = 0.05`.

The upstream URLs and commit hashes are embedded in the JSON. Sources were retrieved on 2026-07-13. Update vectors
only as a reviewed fixture migration, with a new pinned commit and an explanation of any changed tolerance.
