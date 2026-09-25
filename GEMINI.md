# Project Agent Guidelines & Constraints

## STRICT TOOL RESTRICTIONS
1. **NO BROWSER SUBAGENT / SCREEN ACCESS**:
   - The agent is STRICTLY FORBIDDEN from using `browser_subagent` or any browser automation / screen capture tools.
   - NEVER open any browser windows, never record browser sessions, and never request screen or browser control.
   - All tests and checks must be performed exclusively via terminal commands (`run_command`), code inspection (`view_file`), or unit tests.
