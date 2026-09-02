---
id: 005
date: 2026-09-02
topic: split-terminal-cli-log
files_touched: script.js, index.html
decisions:
  - Split terminal into two vertical panes: left EVENT LOG for arrivals/departures/warnings, right CLI OUTPUT for command echoes/results
  - Moved live table boxes to their own row below the split panes to avoid cramping
  - Made CLI input visually boxed with border and dark background, auto-focused, since it was previously easy to miss
open_questions:
  - none
---

Improved the CLI's visibility by giving the input field a proper bordered terminal look instead of a plain transparent text field. Then split the single log terminal into two vertical panes: an EVENT LOG on the left for simulation events and a CLI OUTPUT pane on the right for command results, moving the table displays to a separate row below. Updated script.js with cliLine/clearCliOutput helpers and rerouted runCommand output to the new pane.
