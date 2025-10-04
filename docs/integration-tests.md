# Integration Tests

This document provides information about the integration testing framework used in this project.

## Overview

The integration tests are designed to validate the end-to-end functionality of the Gemini CLI. They execute the built binary in a controlled environment and verify that it behaves as expected when interacting with the file system.

These tests are located in the `integration-tests` directory and are run using a custom test runner.

## Running the tests

The integration tests are not run as part of the default `npm run test` command. They must be run explicitly using the `npm run test:integration:all` script.

The integration tests can also be run using the following shortcut:

```bash
npm run test:e2e
```

## Running a specific set of tests

To run a subset of test files, you can use `npm run <integration test command> <file_name1> ....` where <integration test command> is either `test:e2e` or `test:integration*` and `<file_name>` is any of the `.test.js` files in the `integration-tests/` directory. For example, the following command runs `list_directory.test.js` and `write_file.test.js`:

```bash
npm run test:e2e list_directory write_file
```

### Running a single test by name

To run a single test by its name, use the `--test-name-pattern` flag:

```bash
npm run test:e2e -- --test-name-pattern "reads a file"
```

### Running all tests

To run the entire suite of integration tests, use the following command:

```bash
npm run test:integration:all
```

### Sandbox matrix

The `all` command will run tests for `no sandboxing`, `docker` and `podman`.
Each individual type can be run using the following commands:

```bash
npm run test:integration:sandbox:none
```

```bash
npm run test:integration:sandbox:docker
```

```bash
npm run test:integration:sandbox:podman
```

## Diagnostics

The integration test runner provides several options for diagnostics to help track down test failures.

### Keeping test output

You can preserve the temporary files created during a test run for inspection. This is useful for debugging issues with file system operations.

To keep the test output set the `KEEP_OUTPUT` environment variable to `true`.

```bash
KEEP_OUTPUT=true npm run test:integration:sandbox:none
```

When output is kept, the test runner will print the path to the unique directory for the test run.

### Verbose output

For more detailed debugging, set the `VERBOSE` environment variable to `true`.

```bash
VERBOSE=true npm run test:integration:sandbox:none
```

When using `VERBOSE=true` and `KEEP_OUTPUT=true` in the same command, the output is streamed to the console and also saved to a log file within the test's temporary directory.

The verbose output is formatted to clearly identify the source of the logs:

```
--- TEST: <log dir>:<test-name> ---
... output from the gemini command ...
--- END TEST: <log dir>:<test-name> ---
```

## Linting and formatting

To ensure code quality and consistency, the integration test files are linted as part of the main build process. You can also manually run the linter and auto-fixer.

### Running the linter

To check for linting errors, run the following command:

```bash
npm run lint
```

You can include the `:fix` flag in the command to automatically fix any fixable linting errors:

```bash
npm run lint:fix
```

## Directory structure

The integration tests create a unique directory for each test run inside the `.integration-tests` directory. Within this directory, a subdirectory is created for each test file, and within that, a subdirectory is created for each individual test case.

This structure makes it easy to locate the artifacts for a specific test run, file, or case.

```
.integration-tests/
└── <run-id>/
    └── <test-file-name>.test.js/
        └── <test-case-name>/
            ├── output.log
            └── ...other test artifacts...
```

## Continuous integration

To ensure the integration tests are always run, a GitHub Actions workflow is defined in `.github/workflows/e2e.yml`. This workflow automatically runs the integrations tests for pull requests against the `main` branch, or when a pull request is added to a merge queue.

The workflow runs the tests in different sandboxing environments to ensure Gemini CLI is tested across each:

- `sandbox:none`: Runs the tests without any sandboxing.
- `sandbox:docker`: Runs the tests in a Docker container.
- `sandbox:podman`: Runs the tests in a Podman container.

## Appendix B: Test Properties & Fixtures

### B.1 Test Matrix (properties ↔ unit tests)

| ID | Unit Test | Property (from Sec. Formal Verification) |
| --- | --- | --- |
| P1 | `test_config_validation` | Hysteresis holds: exit thresholds ≤ entry thresholds; illegal SG windows/orders rejected; baselines ≥ max SG window. |
| P2 | `test_arming_logic` | IDLE→PREP (Glissade) only when structure ≥ 85, CI(τ*) ≠ 0, proximity to Angle90 within ε. |
| P3 | `test_disqualification_logic` | Immediate disarm on regime flip (adverse τ*), price invalidation (below arming level), or traversal timeout t > D. |
| P4 | `test_balanchine_adaptive_deadline` | Deadline obeys D = clip(D₀ + 𝟙[tri ≥ 4.5] − 𝟙[τ* ≤ −7], 2, 12). |
| P5 | `test_kinematic_disqualification_and_hysteresis` | Momentum dips inside hysteresis band 𝓗 do not disarm; outside 𝓗 do disarm. |
| P6 | `test_fires_on_ideal_blowoff` | On confluence (arming + persistence + acceleration + FTR breach) emit Coda payload and one-shot reset to IDLE. |
| G1 | `test_glisse_prep_to_jete` | Glissade→Jeté only on glitch confirm within deadline; narration present. |
| G2 | `test_fermata_pause_and_resume` | Fermata pauses clock; resume on stabilization; timer update applied. |
| G3 | `test_corps_reset_on_negate_or_timeout` | Glitch_Negate or t = D triggers Corps Reset; scale gate remains closed. |

### B.2 Core Fixtures

#### B.2.1 Synthetic price series (deterministic)

```python
def mk_series(base=1800.0, n=180, seed=7, blowoff=None):
    rng = np.random.default_rng(seed)
    x = base + rng.normal(0, 0.25, n).cumsum()
    if blowoff:
        i0, amp = blowoff
        x[i0:i0+3] += np.array([amp * 0.4, amp * 0.9, amp * 1.1])  # parabolic kick
    ts = pd.date_range('2025-10-03 20:00:00', periods=n, freq='1min', tz='UTC')
    return pd.DataFrame({'close': x}, index=ts)
```

#### B.2.2 Levels from 4h swing

```python
def mk_levels(df):
    sw = df['close'].iloc[-240:] if len(df) >= 240 else df['close']
    C = float(sw.iloc[-1])
    A = (float(sw.max()) - float(sw.min())) / 6.0
    return {
        'guard_low': C - 0.5 * A,
        'pivot_45d': C - 1.0 * A,
        'ang_45': C + 1.0 * A,
        'ang_90': C + 1.5 * A,
        'ang_180': C + 2.5 * A,
    }
```

#### B.2.3 Minimal comps & regime

```python
def mk_comps(structure=88, perm_p=0.25, tau_ci_ok=True, **kw):
    return {
        'structure_weight': structure,
        'perm_p': perm_p,
        'tau_ci_ok': tau_ci_ok,
        'regime': 'Defensive/Fade-Short',
        'glitch_signals': kw.get('glitch', {}),
        'hard_stop': kw.get('stop', 0.0),
        't1': kw.get('t1', 0.0),
        'kinematics_ok': kw.get('kin_ok', True),
        'risk_budget_bps': kw.get('risk_bps', 50),
    }
```

### B.3 Golden-path Scenarios (summaries)

- **Arming success (P2):** Price approaches `ang_90` within ε = 0.75, structure = 88, CI(τ*) ≠ 0 ⇒ state PREP, cue Glissade.
- **Adaptive deadline (P4):** (D₀, tri, τ*) = (4, 4.8, −8) ⇒ D = 4 + 1 − 1 = 4; (4, 5.2, −2) ⇒ 5; (4, 3.0, −9) ⇒ 3.
- **Ideal blowoff (P6):** Three-bar surge breaches FTR with persistence (m = 3) and acceleration ⇒ Coda + reset.

### B.4 Mock/Stub Contracts

1. **SSI:** return 9.5 during tests unless a specific 'calm' case needs < 9.0 for disqualification.
2. **Kinematics:** expose (z_{v1}, z_{v2}, z_a); provide a toggle to inject hysteresis band 𝓗 for P5.
3. **Glitch flags:** `{'wick': True}` is sufficient for Jeté; `'negate': True` must produce Corps Reset.

### B.5 Minimal Assertions (ready to translate to `pytest`)

```python
# P4: deadline law
D0, tri, tau = 4, 4.6, -8.0
assert eff_deadline(D0, tri, tau) == 4  # +1 and -1 cancel
assert eff_deadline(4, 5.0, -1.0) == 5  # stretch
assert eff_deadline(4, 3.0, -8.5) == 3  # compress (>=2 lower bound)

# G1: PREP -> JETÉ on glitch confirm inside window
engine = GlisseEngine(GlisseConfig())  # defaults: cap=50bps, epsilon=0.75
x = mk_inputs(
    price=4655.6,
    Angle90=4655.6,
    structure=90,
    perm_p=0.02,
    ticks_left=3,
    glitch_signals={'wick': True},
)
ev = engine.step(101, x)
assert ev and ev.cue.name in ('GLISSade', 'GLITCH_CONFIRM', 'JETÉ')  # depending on prior call
```

### B.6 Reproducibility Switches

- Fix RNG seeds in all synthetic series; freeze dates/times (`tz='UTC'`).
- Use `median/MAD` option for robust z (ensures stable tails across runs).
- Embargo last g minutes from baselines to avoid contamination (as in Sec. 2.3).

### B.7 Expected Cue Log (golden sample for diff)

```text
[PREP] Glissade: structure 88/100, p=0.33 (tactical). Angle90=4655.6, cap=50bps.
[PREP] Glitch_Scan: 3 ticks left.
[JETÉ] Glitch confirm (wick). Short; stop=4662.5; t1=4647.7; guard=4624.1.
[FERMATA] Vol spike. Pause 2 ticks; stops tighten.
[JETÉ] Release; resume phrase.
[CODA_PROFIT] Target touch; scale exit.
[CORPS_RESET] Sequence complete.
```
