---
name: Open Source Preparation
overview: Prepare libcat for open source release by auditing for sensitive data, adding proper licensing with liability disclaimers, and enhancing documentation for contributors.
todos:
  - id: add-license
    content: Create LICENSE file with full MIT license text
    status: completed
  - id: update-readme
    content: Enhance README with build prerequisites and contributing section
    status: completed
  - id: add-contributing
    content: Create CONTRIBUTING.md with guidelines for contributors
    status: completed
  - id: verify-gitignore
    content: Verify release/, dist/, dist-electron/ are not in git history
    status: completed
---

# Open Source Preparation Plan for LibCat

## Security Audit Results

**Good news: No sensitive information found in the codebase.**

- No hardcoded API keys, passwords, or secrets
- TMDB API keys are stored per-user in their local SQLite database (users provide their own)
- Profile passwords are properly hashed with PBKDF2 (10,000 iterations + salt)
- No personal file paths, usernames, or email addresses embedded
- The [`.gitignore`](.gitignore) already excludes `.env`, `node_modules/`, `dist/`, `dist-electron/`, and `release/`

**Console logs** (36 total) are all appropriate error handling (`console.error`) plus one benign migration message - acceptable for open source.

---

## License Recommendations

Since you want **no liability for damages** and **all code open source**, here are your best options:

| License | Liability Protection | Open Source | Copyleft | Notes |

|---------|---------------------|-------------|----------|-------|

| **MIT** | Yes ("AS IS") | Yes | No | Currently in package.json. Simple, widely used, very permissive |

| **Apache 2.0** | Yes (explicit) | Yes | No | Stronger patent protection, explicit liability disclaimer |

| **BSD 3-Clause** | Yes | Yes | No | Similar to MIT, adds no-endorsement clause |

| **GPLv3** | Yes | Yes | Yes | Ensures derivatives stay open, stronger copyleft |

**Recommendation: MIT License** - It's already specified in your `package.json`, is widely recognized, and includes standard liability disclaimers:

```
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND...
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES...
```

---

## Required Actions

### 1. Add LICENSE File

Create a `LICENSE` file in the project root with the full MIT license text (or your chosen license).

### 2. Update README.md

Enhance the existing [readme.md](readme.md) with:

- Clear build prerequisites (Node.js version, FFmpeg installation)
- Development setup instructions
- Contributing guidelines section
- License badge

### 3. Add CONTRIBUTING.md

Create contribution guidelines covering:

- How to report issues
- Pull request process
- Code style expectations

### 4. Verify .gitignore Coverage

The `.gitignore` already covers the essentials. Ensure these folders are NOT committed:

- `release/` (contains built .exe files)
- `dist/` and `dist-electron/` (build artifacts)
- `node_modules/`

### 5. Optional: Remove Console Logs

The 36 console statements are all appropriate error logging. You may optionally clean up the single `console.log` in [electron/services/profiles.ts](electron/services/profiles.ts) line 247 (migration message), but this is not critical.

---

## Files to Create/Modify

| File | Action |

|------|--------|

| `LICENSE` | Create (MIT license text) |

| `readme.md` | Update with enhanced build docs |

| `CONTRIBUTING.md` | Create (optional but recommended) |